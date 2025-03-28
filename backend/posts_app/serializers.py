# backend/posts_app/serializers.py
from rest_framework import serializers
from .models import Post, InterviewPost, Comment
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

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
        fields = ['round_number', 'round_type', 'round_type_display']

class PostListSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    round_number = serializers.SerializerMethodField()  
    
    class Meta:
        model = Post
        fields = [
            'id', 'username', 'post_type', 'title', 
            'content', 'company', 'interview_date', 'created_at',
            'likes_count', 'comments_count', 'round_number' 
        ]
    
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
    interview_details = InterviewPostSerializer(read_only=True)
    comments = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'user', 'post_type', 'title', 'content',
            'visibility', 'company', 'interview_date', 'created_at',
            'interview_details', 'comments', 'likes_count'
        ]
    
    def get_comments(self, obj):
        # Only get top-level comments
        comments = obj.comments.filter(parent_comment=None)
        return CommentSerializer(comments, many=True).data
    
    def get_likes_count(self, obj):
        return obj.likes.count()

    
class PostCreateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    interview_details = InterviewPostSerializer(read_only=True)  # ✅ This is the fix

    class Meta:
        model = Post
        fields = [
            'id', 'username', 'post_type', 'title', 
            'content', 'company', 'interview_date', 'created_at',
            'likes_count', 'comments_count', 'interview_details'  # ✅ Add this
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
