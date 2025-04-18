# backend/posts_app/views.py
import requests
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.views.decorators.csrf import csrf_exempt
from .serializers import PostListSerializer, PostDetailSerializer, CommentSerializer, PostCreateSerializer, ProblemSerializer, UserProfileSerializer
from django.contrib.auth.models import User
from rest_framework.decorators import api_view
from rest_framework.authtoken.models import Token
from django.utils import timezone
from rest_framework.decorators import permission_classes
from datetime import timedelta
from django.db.models import Count
from .models import Like, UserProfile, Post, InterviewPost, Comment, Problem, TestCase, ProblemSolveLog
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from django.db import models
import subprocess
import uuid
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
import os
import traceback
import json
import logging
import openai
from dotenv import load_dotenv

# Load environment variables (.env must have OPENAI_API_KEY)
load_dotenv() 
openai.api_key = os.getenv("OPENAI_API_KEY")
# Stores the GPT-generated problem statement & test cases:
#   { question_id: { "problem_statement": str, "test_cases": [...] } }
PROBLEM_STORE = {}

# Stores conversation so we can ask GPT for hints/solutions with context:
#   { question_id: [ {role: "system", content: ...}, {role: "assistant", content: ...}, ... ] }
CONVERSATION_STORE = {}


class UserProfileViewSet(viewsets.ViewSet):
    def retrieve(self, request, pk=None):
        try:
            user = User.objects.get(pk=pk)
            profile = user.profile
            serializer = UserProfileSerializer(profile, context={'request': request})
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    @permission_classes([IsAuthenticated])
    def me(self, request):
        try:
            profile = request.user.profile
        except UserProfile.DoesNotExist:
            return Response({"error": "User profile does not exist"}, status=status.HTTP_404_NOT_FOUND)

        serializer = UserProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def follow(self, request, pk=None):
        try:
            target_user = User.objects.get(pk=pk)
            if target_user == request.user:
                return Response({"error": "Cannot follow yourself."}, status=400)

            profile = request.user.profile
            target_profile = target_user.profile

            if profile.following.filter(pk=target_profile.pk).exists():
                profile.following.remove(target_profile)
                return Response({"message": "Unfollowed successfully."})
            else:
                profile.following.add(target_profile)
                return Response({"message": "Followed successfully."})
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=404)


    @action(detail=True, methods=['get'])
    def followers(self, request, pk=None):
        try:
            user = User.objects.get(pk=pk)
            followers = user.profile.followers.all()
            serializer = UserProfileSerializer(followers, many=True, context={"request": request})
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

    @action(detail=True, methods=['get'])
    def following(self, request, pk=None):
        try:
            user = User.objects.get(pk=pk)
            following = user.profile.following.all()
            serializer = UserProfileSerializer(following, many=True, context={"request": request})
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
        
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated], parser_classes=[MultiPartParser])
    def upload_avatar(self, request):
        user_profile = request.user.profile
        avatar_file = request.FILES.get('avatar')

        if not avatar_file:
            return Response({"error": "No file uploaded"}, status=400)

        user_profile.avatar.save(avatar_file.name, avatar_file)
        user_profile.save()
        return Response({"message": "Avatar uploaded successfully", "avatar_url": user_profile.avatar.url})
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def user_timeline(self, request):
         company = request.query_params.get('company')
         position = request.query_params.get('position')
         user_id = request.query_params.get('user_id')
 
         if not company or not position:
             return Response({"error": "company and position are required"}, status=400)
 
         try:
             if user_id:
                 user = User.objects.get(pk=user_id)
             else:
                 user = request.user
         except User.DoesNotExist:
             return Response({"error": "User not found"}, status=404)
 
         queryset = Post.objects.filter(
             user=user,
             post_type='interview',
             company=company,
             position=position
         )
 
         if user != request.user:
             queryset = queryset.filter(visibility='public')
 
         queryset = queryset.order_by('interview_date', 'created_at')
 
         data = [
             {
                 'id': post.id,
                 'title': post.title,
                 'interview_date': post.interview_date,
                 'round_number': getattr(getattr(post, 'interview_details', None), 'round_number', None),
                 'round_type': getattr(getattr(post, 'interview_details', None), 'round_type', None),
                 'status': getattr(getattr(post, 'interview_details', None), 'status', 'pending'),
             }
             for post in queryset
         ]
 
         return Response(data)




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
        user = self.request.user
        queryset = Post.objects.all()

        if user.is_authenticated:
            queryset = queryset.filter(
                models.Q(visibility='public') | models.Q(user=user)
            )
        else:
            queryset = queryset.filter(visibility='public')

        # Filter by round_type (used in dashboard filters)
        round_type = self.request.query_params.get('round_type')
        if round_type:
            queryset = queryset.filter(interview_details__round_type=round_type)

        # Optional: filter by user id for public viewing
        user_id = self.request.query_params.get('user')
        if user_id:
            queryset = queryset.filter(user__id=user_id)

        queryset = queryset.annotate(
            likes_count=Count('likes'),
            comments_count=Count('comments')
        )

        return queryset




    def perform_create(self, serializer):
        post = serializer.save()
        user_profile = post.user.profile
        user_profile.posts_count += 1
        user_profile.activity_count += 1  # Add this line
        user_profile.exp += 10
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

        post_author_profile = post.user.profile
        post_author_profile.total_likes = post.likes.count()
        post_author_profile.save()

        return Response({'liked': liked, 'likes_count': post.likes.count()})

    @action(detail=False, methods=['get'])
    def my_posts(self, request):
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

        queryset = Post.objects.filter(user=request.user)

        post_type = request.query_params.get('post_type')
        company = request.query_params.get('company')
        position = request.query_params.get('position')

        if post_type:
            queryset = queryset.filter(post_type=post_type)
        if company:
            queryset = queryset.filter(company=company)
        if position:
            queryset = queryset.filter(position=position)

        queryset = queryset.annotate(
            likes_count=Count('likes'),
            comments_count=Count('comments')
        )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = PostListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)

        serializer = PostListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_timeline(self, request):
         company = request.query_params.get('company')
         position = request.query_params.get('position')
 
         if not company or not position:
             return Response({"error": "company and position are required"}, status=400)
 
         user = request.user
         posts = Post.objects.filter(
             user=user,
             post_type='interview',
             company=company,
             position=position
         ).order_by('interview_date', 'created_at')
 
         data = [
             {
                 'id': post.id,
                 'title': post.title,
                 'interview_date': post.interview_date,
                 'round_number': getattr(getattr(post, 'interview_details', None), 'round_number', None),
                 'round_type': getattr(getattr(post, 'interview_details', None), 'round_type', None),
                 'status': getattr(getattr(post, 'interview_details', None), 'status', 'pending'),
             }
             for post in posts
         ]
 
         return Response(data)



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
    if request.method != "POST":
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)

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
                {"input": tc.input_data, "expected": tc.expected_output}
                for tc in test_cases
            ]
        }

        temp_dir = f"/tmp/code_runner_{uuid.uuid4()}"
        os.makedirs(temp_dir, exist_ok=True)

        input_path = os.path.join(temp_dir, "input.json")
        output_path = os.path.join(temp_dir, "output.json")

        with open(input_path, "w") as f:
            json.dump(test_data, f)

        subprocess.run([
            "docker", "run", "--rm",
            "--network", "none", "--memory", "128m", "--cpus", "0.5",
            "--pids-limit", "64", "--read-only",
            "-v", f"{temp_dir}:/app/data",
            "--security-opt", "no-new-privileges", "--user", "1000:1000",
            "code-sandbox"
        ], timeout=10)

        with open(output_path, "r") as f:
            result_data = json.load(f)


        subprocess.run(["rm", "-rf", temp_dir])

        if "results" in result_data:
            passed_all = all(res["status"] == "pass" for res in result_data["results"])


            if request.user and request.user.is_authenticated:
                ProblemSolveLog.objects.update_or_create(
                    user=request.user,
                    problem=problem,
                    defaults={"passed": passed_all}
                )

            output_lines = []
            for i, res in enumerate(result_data["results"], 1):
                if res["status"] == "pass":
                    output_lines.append(f"Test case {i}: Passed")
                elif res["status"] == "fail":
                    output_lines.append(f"Test case {i}: Failed\n  Input: {res['input']}\n  Expected: {res['expected']}\n  Got: {res['got']}")
                elif res["status"] == "error":
                    output_lines.append(f"Test case {i}: Error\n  Message: {res['message']}")

            return JsonResponse({"output": "\n\n".join(output_lines)})

        elif "error" in result_data:
            return JsonResponse({"output": f"Execution error: {result_data['error']}"})

    except Problem.DoesNotExist:
        return JsonResponse({'error': 'Problem not found'}, status=404)
    except subprocess.TimeoutExpired:
        return JsonResponse({'error': 'Code execution timed out'}, status=408)
    except Exception as e:
        error_message = f"{str(e)}\n\n{traceback.format_exc()}"
        return JsonResponse({'error': error_message}, status=500)


# Check if conversation exists for the given question_id
def initialize_conversation(question_id):
    if question_id not in CONVERSATION_STORE:
        # Initialize the conversation if not already present
        CONVERSATION_STORE[question_id] = [
            {"role": "system", "content": "You are a helpful coding tutor."},
            {"role": "user", "content": "I need help with a Python problem."}
        ]
    return CONVERSATION_STORE[question_id]

@csrf_exempt
def ask_for_hint_solution_feedback(request):
    logging.info(f"Received POST request at /api/ask/ with body: {request.body}")

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            question_id = data.get('question_id')
            request_type = data.get('request_type')
            user_approach = data.get('user_approach', None)
        except Exception as e:
            logging.error(f"Invalid JSON: {e}")
            return JsonResponse({"error": f"Invalid JSON: {e}"}, status=400)

        # Ensure the conversation is initialized
        conversation_history = initialize_conversation(question_id)

        if not conversation_history:
            return JsonResponse({"error": "No conversation found for that question_id."}, status=404)

        # Build system + user messages
        if request_type == "hint":
            system_content = "You are a helpful coding tutor providing step-by-step hints."
            user_content = "Give me a helpful hint for the problem above."
        elif request_type == "solution":
            system_content = "You are a coding assistant that provides thorough solutions."
            user_content = "Please provide the full solution for the problem above."
        elif request_type == "feedback":
            system_content = "You are a constructive coding mentor that offers feedback."
            if user_approach:
                # Insert the user's approach into the conversation
                conversation_history.append({"role": "user", "content": f"My approach: {user_approach}"})
            user_content = "Provide detailed feedback on my approach above."
        else:
            return JsonResponse({"error": "Invalid request_type. Must be 'hint', 'solution', or 'feedback'."}, status=400)

        # Add new system & user messages
        conversation_history.append({"role": "system", "content": system_content})
        conversation_history.append({"role": "user", "content": user_content})

        try:
            # API call to OpenAI
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",  # You can change this model if needed
                messages=conversation_history,
                max_tokens=700,
                temperature=0.7
            )
        except openai.error.OpenAIError as e:  # Catch all OpenAI errors
            logging.error(f"OpenAI call failed with error: {e}")
            return JsonResponse({"error": f"OpenAI call failed: {e}"}, status=400)
        except Exception as e:  # Catch other exceptions
            logging.error(f"Unexpected error: {e}")
            return JsonResponse({"error": f"Unexpected error: {e}"}, status=500)

        gpt_answer = response.choices[0].message["content"]
        # Save GPT's answer as 'assistant' role
        conversation_history.append({"role": "assistant", "content": gpt_answer})
        CONVERSATION_STORE[question_id] = conversation_history
        print("✅ Using OpenAI key:", openai.api_key)
        print("✅ Request type:", request_type)
        print("✅ Conversation messages:", conversation_history)


        return JsonResponse({"answer": gpt_answer})
    else:
        return JsonResponse({"error": "Only POST allowed"}, status=405)