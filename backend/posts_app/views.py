# backend/posts_app/views.py
import requests
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Post, InterviewPost, Comment
from .serializers import PostListSerializer, PostDetailSerializer, CommentSerializer, PostCreateSerializer
from django.contrib.auth.models import User
from rest_framework.decorators import api_view
from rest_framework.authtoken.models import Token
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count
from .models import Like
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse


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
        return serializer.save()

    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = self.perform_create(serializer)


        output_serializer = PostDetailSerializer(post, context=self.get_serializer_context())
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


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

        # fallback for unauthenticated users
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
        last_week = timezone.now() - timedelta(days=7)
        queryset = Post.objects.filter(visibility='public', created_at__gte=last_week)

        # Annotate with likes_count and order by it
        queryset = queryset.annotate(likes_count=Count('likes')).order_by('-likes_count')[:5]

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
            # Like already exists, so remove it
            like.delete()
            liked = False
        else:
            liked = True

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