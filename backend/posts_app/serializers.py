# backend/posts_app/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Problem, TestCase, UserProfile, Post, InterviewPost, Comment

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
        'user', 'exp', 'total_post_views', 'total_likes',
        'posts_count', 'activity_count',
        'followers_count', 'following_count',
        'is_following'  
    ]

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.user.profile.following.count()
    
    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj in request.user.profile.following.all()
        return False


class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = ['id', 'user', 'content', 'created_at', 'replies']
    
    def get_replies(self, obj):
        if not obj.replies.exists():
            return []
        return CommentSerializer(obj.replies.all(), many=True).data

class InterviewPostSerializer(serializers.ModelSerializer):
    round_type_display = serializers.CharField(source='get_round_type_display', read_only=True)
    
    class Meta:
        model = InterviewPost
        fields = ['round_number', 'round_type', 'round_type_display', 'position', 'status']

    def update(self, instance, validated_data):
        instance.status = validated_data.get('status', instance.status)
        instance.save()
        return instance

class PostListSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    round_number = serializers.SerializerMethodField()  
    liked = serializers.SerializerMethodField() 
    
    class Meta:
        model = Post
        fields = [
            'id', 'username', 'post_type', 'title', 
            'content', 'company', 'position', 'interview_date', 'created_at',
            'likes_count', 'comments_count', 'round_number', 'liked' 
        ]

    def get_liked(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False
    
    def get_likes_count(self, obj):
        return obj.likes.count()
    
    def get_comments_count(self, obj):
        return obj.comments.count()
    
    def get_round_number(self, obj):
        try:
            return obj.interview_details.round_number
        except InterviewPost.DoesNotExist:
            return None

class PostDetailSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    interview_details = InterviewPostSerializer(required=False)
    comments = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    timeline = serializers.SerializerMethodField() 
    liked = serializers.SerializerMethodField() 
    
    class Meta:
        model = Post
        fields = [
            'id', 'user', 'post_type', 'title', 'content',
            'visibility', 'company', 'position', 'interview_date', 'created_at',
            'interview_details', 'comments', 'likes_count', 'timeline', 'liked'
        ]

    def get_liked(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False
    
    def get_comments(self, obj):
        # Only get top-level comments
        comments = obj.comments.filter(parent_comment=None)
        return CommentSerializer(comments, many=True).data
    
    def get_likes_count(self, obj):
        return obj.likes.count()
    
    def update(self, instance, validated_data):
        interview_details_data = validated_data.pop('interview_details', None)

        # Update Post fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update InterviewPost fields if provided
        if interview_details_data and hasattr(instance, 'interview_details'):
            interview_instance = instance.interview_details
            for attr, value in interview_details_data.items():
                setattr(interview_instance, attr, value)
            interview_instance.save()

        return instance


    def get_timeline(self, obj):
        if not obj.company or not obj.position:
            return []  

        related_posts = Post.objects.filter(
            user=obj.user,
            company=obj.company,
            position=obj.position
        ).order_by('interview_date', 'created_at')

        return [
            {
                'id': post.id,
                'title': post.title,
                'interview_date': post.interview_date,
                'round_number': getattr(getattr(post, 'interview_details', None), 'round_number', None),
                'status': getattr(getattr(post, 'interview_details', None), 'status', 'pending'),

            }
            for post in related_posts
        ]
    
    
    
class PostCreateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    interview_details = InterviewPostSerializer(write_only=True, required=False)
    class Meta:
        model = Post
        fields = [
            'id', 'username', 'post_type', 'title', 
            'content', 'company', 'position', 'interview_date', 'created_at',
            'likes_count', 'comments_count', 'interview_details'
        ]


    def get_round_number(self, obj):
        try:
            return obj.interview_details.round_number
        except InterviewPost.DoesNotExist:
            return None
    
    def create(self, validated_data):
        interview_data = validated_data.pop('interview_details', None)  
        user = self.context['request'].user

        if not user or not user.is_authenticated:
            raise serializers.ValidationError("Authentication required.")

        post = Post.objects.create(user=user, **validated_data)

        if post.post_type == 'interview' and interview_data:
            InterviewPost.objects.create(
                post=post,
                round_number=interview_data.get('round_number', 1),
                round_type=interview_data.get('round_type', 'technical_interview')
            )

        return post


class TestCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestCase
        fields = ['id', 'input_data', 'expected_output']


class ProblemSerializer(serializers.ModelSerializer):
    test_cases = TestCaseSerializer(many=True, read_only=True)

    class Meta:
        model = Problem
        fields = ['id', 'title', 'description', 'function_name', 'test_cases']