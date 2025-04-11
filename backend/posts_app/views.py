# backend/posts_app/views.py
import requests
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Post, InterviewPost, Comment, Problem, TestCase
from django.views.decorators.csrf import csrf_exempt
from .serializers import PostListSerializer, PostDetailSerializer, CommentSerializer, PostCreateSerializer, ProblemSerializer, UserProfileSerializer
from django.contrib.auth.models import User
from rest_framework.decorators import api_view
from rest_framework.authtoken.models import Token
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count
from .models import Like
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from django.db import models
import subprocess
import uuid
import os
import traceback
import json


class UserProfileViewSet(viewsets.ViewSet):
    def retrieve(self, request, pk=None):
        try:
            user = User.objects.get(pk=pk)
            profile = user.profile
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def me(self, request):
        profile = request.user.profile
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def follow(self, request, pk=None):
        try:
            target_user = User.objects.get(pk=pk)
            profile = request.user.profile

            if target_user.profile in profile.following.all():
                profile.following.remove(target_user.profile)
                return Response({"detail": "Unfollowed"})
            else:
                profile.following.add(target_user.profile)
                return Response({"detail": "Followed"})
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)


class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.filter(visibility='public')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['company', 'post_type']
    search_fields = ['title', 'content', 'company']
    ordering_fields = ['created_at', 'title', 'likes_count', 'comments_count']

    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PostListSerializer
        elif self.action == 'create':
            return PostCreateSerializer
        return PostDetailSerializer

    
    def get_queryset(self):
        queryset = super().get_queryset()

        round_type = self.request.query_params.get('round_type')
        if round_type:
            queryset = queryset.filter(interview_details__round_type=round_type)

        queryset = queryset.annotate(
            likes_count=Count('likes'),
            comments_count=Count('comments')
        )

        return queryset

    

    def perform_create(self, serializer):
        post = serializer.save()
        user_profile = post.user.profile

        user_profile.posts_count += 1
        user_profile.activity_count += 1  # only counting posts for now
        user_profile.exp += 10  # for example, 10 EXP per post
        user_profile.save()

        return post
        
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = self.perform_create(serializer)

        post.refresh_from_db()  
        output_serializer = PostDetailSerializer(post, context=self.get_serializer_context())
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()

        # Increase post views
        instance.views = getattr(instance, 'views', 0) + 1
        instance.save()

        # Update user's total post views
        user_profile = instance.user.profile
        user_profile.total_post_views = Post.objects.filter(user=instance.user).aggregate(
            total=models.Sum('views')
        )['total'] or 0
        user_profile.save()

        serializer = PostDetailSerializer(instance, context = {'request': request})
        return Response(serializer.data)



    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        post = self.get_object()
        parent_id = request.data.get('parent_comment_id')

        parent_comment = None
        if parent_id:
            try:
                parent_comment = Comment.objects.get(id=parent_id, post=post)
            except Comment.DoesNotExist:
                return Response(
                    {"error": "Parent comment not found"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        user = request.user
        if not user or not user.is_authenticated:
            return Response({"error": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)
            

        comment = Comment.objects.create(
            post=post,
            user=user,
            parent_comment=parent_comment,
            content=request.data.get('content', '')
        )

        serializer = CommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def trending(self, request):
        # Only include public posts from the last 7 days
        last_week = timezone.now() - timedelta(days=30)
        queryset = Post.objects.filter(visibility='public', created_at__gte=last_week)

        # Annotate with likes_count and order by it
        queryset = queryset.annotate(likes_count=Count('likes')).order_by('-likes_count')[:8]

        serializer = PostListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        post = self.get_object()

        user = request.user
        if not user or not user.is_authenticated:
            user, _ = User.objects.get_or_create(
                username='temp_user',
                defaults={'email': 'temp@example.com'}
            )
            user.set_password('temp_password')
            user.save()

        like, created = Like.objects.get_or_create(user=user, post=post)

        if not created:
            like.delete()
            liked = False
        else:
            liked = True

        # ✅ Now update the profile after like/unlike is done
        post_author_profile = post.user.profile
        post_author_profile.total_likes = post.likes.count()
        post_author_profile.save()

        return Response({'liked': liked, 'likes_count': post.likes.count()})

    
@api_view(['POST'])
def google_login(request):
    token = request.data.get('token')
    if not token:
        return Response({"error": "Missing token"}, status=400)

    google_user_info_url = 'https://www.googleapis.com/oauth2/v3/tokeninfo'
    response = requests.get(google_user_info_url, params={'id_token': token})

    print("🔍 Google response status:", response.status_code)
    print("🔍 Google response content:", response.text)

    if response.status_code != 200:
        return Response({"error": "Invalid token"}, status=400)

    data = response.json()
    email = data.get('email')
    name = data.get('name')

    if not email:
        return Response({"error": "Email not found in Google data"}, status=400)

    from django.contrib.auth.models import User
    from rest_framework.authtoken.models import Token

    user, created = User.objects.get_or_create(username=email, defaults={"email": email, "first_name": name})
    token_obj, _ = Token.objects.get_or_create(user=user)

    return Response({
        "token": token_obj.key,
        "user": {
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
        }
    })

@ensure_csrf_cookie
def get_csrf_token(request):
    return JsonResponse({'detail': 'CSRF cookie set'})

class ProblemViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Problem.objects.all()
    serializer_class = ProblemSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['id', 'title']
    ordering = ['id']


@csrf_exempt
def code_verification(request):
    if (request.method != "POST"):
        return JsonResponse({'error':'Only POST method allowed'}, status=405)
    try:
        data = json.loads(request.body)
        code = data.get('code')
        problem_id = data.get('question_id')

        if not code or not problem_id:
            return JsonResponse({'error': 'Missing code or question_id'}, status=400)
        
        problem = Problem.objects.get(id=problem_id)
        test_cases = TestCase.objects.filter(problem=problem)
        
        test_data = {
            "code": code,
            "function_name": problem.function_name,
            "test_cases": [
                {
                    "input": tc.input_data,
                    "expected": tc.expected_output
                } for tc in test_cases
            ]
        }
        
        temp_dir = f"/tmp/code_runner_{uuid.uuid4()}"
        os.makedirs(temp_dir, exist_ok=True)

        input_path = os.path.join(temp_dir, "input.json")
        output_path = os.path.join(temp_dir, "output.json")

        with open(input_path, "w") as f:
            json.dump(test_data, f)

        # Run Docker container
        # subprocess.run([
        #     "docker", "run",
        #     "--rm",
        #     "-v", f"{temp_dir}:/app/data",
        #     "code-sandbox"
        # ], timeout=10)
        subprocess.run([
            "docker", "run",
            "--rm",
            "--network", "none",                      # No network access
            "--memory", "128m",                       # Memory limit
            "--cpus", "0.5",                          # CPU limit
            "--pids-limit", "64",                     # Limit number of processes
            "--read-only",                            # Container's filesystem is read-only
            "-v", f"{temp_dir}:/app/data",         
            "--security-opt", "no-new-privileges",    # Prevent privilege escalation
            "--user", "1000:1000",                    # Non-root user inside container
            "code-sandbox"
        ], timeout=10)
        
        with open(output_path, "r") as f:
            result_data = json.load(f)

        # Clean up
        subprocess.run(["rm", "-rf", temp_dir])

        if "results" in result_data:
            output_lines = []
            for i, res in enumerate(result_data["results"], 1):
                if res["status"] == "pass":
                    output_lines.append(f"Test case {i}: Passed")
                elif res["status"] == "fail":
                    output_lines.append(
                        f"Test case {i}: Failed\n  Input: {res['input']}\n  Expected: {res['expected']}\n  Got: {res['got']}"
                    )
                elif res["status"] == "error":
                    output_lines.append(
                        f"Test case {i}: Error\n  Message: {res['message']}"
                    )
            output = "\n\n".join(output_lines)
            return JsonResponse({"output": output})

        elif "error" in result_data:
            return JsonResponse({"output": f"Execution error: {result_data['error']}"})
    
    except Problem.DoesNotExist:
        return JsonResponse({'error': 'Problem not found'}, status=404)
    except subprocess.TimeoutExpired:
        return JsonResponse({'error': 'Code execution timed out'}, status=408)
    except Exception as e:
        error_message = f"{str(e)}\n\n{traceback.format_exc()}"
        return JsonResponse({'error': error_message}, status=500)

