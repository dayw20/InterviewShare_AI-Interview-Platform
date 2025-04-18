# backend/posts_app/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Problem, TestCase, UserProfile, Post, InterviewPost, Comment, Like, ProblemSolveLog, Post
from collections import Counter
from django.db import models
from datetime import date, timedelta
from django.db.models import Count
from django.db.models.functions import TruncDate
from collections import defaultdict

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'avatar']

    def get_avatar(self, obj):
        request = self.context.get('request')
        avatar = getattr(obj.profile, 'avatar', None)
        if avatar:
            avatar_url = avatar.url
            if request is not None:
                return request.build_absolute_uri(avatar_url)
            return avatar_url
        return None

class UserProfileSerializer(serializers.ModelSerializer):

    round_type_mapping = serializers.SerializerMethodField()

    user = UserSerializer(read_only=True)
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    job_status = serializers.SerializerMethodField()
    coding_status = serializers.SerializerMethodField()
    commit_records = serializers.SerializerMethodField()
    job_records = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    posts_count = serializers.SerializerMethodField()
    exp = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['user', 'exp', 'likes_count', 'posts_count', 'avatar', 
            'followers_count', 'following_count', 'round_type_mapping',
            'job_status', 'coding_status', 'commit_records', 'job_records']

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.user.profile.following.count()
    
    def get_likes_count(self, obj):
        # return Like.objects.filter(user=obj.user).values_list('id', flat=True).count()
        request = self.context.get('request')
        is_self = request and request.user == obj.user
 
        posts = Post.objects.filter(user=obj.user)
 
        if not is_self:
            posts = posts.filter(visibility='public')
 
        return Like.objects.filter(post__in=posts).count()
    
    def get_posts_count(self, obj):
        # return Post.objects.filter(user=obj.user).values_list('id', flat=True).count()
         request = self.context.get('request')
         is_self = request and request.user == obj.user
         queryset = Post.objects.filter(user=obj.user)
         if not is_self:
             queryset = queryset.filter(visibility='public')
         return queryset.count()
    
    def get_exp(self, obj):
        return obj.exp
    
    def get_round_type_mapping(self, obj):
        return dict(InterviewPost.ROUND_TYPE_CHOICES)
    
    def get_coding_status(self, obj):
        return []
    
    def get_coding_status(self, obj):
        logs = ProblemSolveLog.objects.filter(user=obj.user).select_related('problem')
        difficulty_count = {'Easy': 0, 'Medium': 0, 'Hard': 0}

        for log in logs:
            diff = log.problem.difficulty
            if diff == 'easy':
                difficulty_count['Easy'] += 1
            elif diff == 'medium':
                difficulty_count['Medium'] += 1
            elif diff == 'hard':
                difficulty_count['Hard'] += 1

        return [{'name': k, 'value': v} for k, v in difficulty_count.items()]


    def get_avatar(self, obj):
        request = self.context.get("request")
        if obj.avatar:
            avatar_url = obj.avatar.url
            if request is not None:
                return request.build_absolute_uri(avatar_url)
            return avatar_url
        return None
    
    # def get_commit_records(self, obj):
    #     return []

    def get_commit_records(self, obj):

        today = date.today()
        start_date = today - timedelta(days=100)

        solve_logs = (
            ProblemSolveLog.objects.filter(user=obj.user, solved_at__date__gte=start_date)
            .annotate(day=TruncDate('solved_at'))
            .values('day')
            .annotate(count=Count('id'))
        )

        post_logs = (
            Post.objects.filter(user=obj.user, created_at__date__gte=start_date)
            .annotate(day=TruncDate('created_at'))
            .values('day')
            .annotate(count=Count('id'))
        )
        combined_count = defaultdict(int)
        for entry in solve_logs:
            combined_count[entry['day']] += entry['count']
        for entry in post_logs:
            combined_count[entry['day']] += entry['count']

        result = []
        for i in range(100):
            d = today - timedelta(days=i)
            result.append({
                'date': d.isoformat(),
                'count': combined_count.get(d, 0)
            })

        return result[::-1] 



    def get_job_status(self, obj):
        # Define a mapping from round_number to display name
        round_number_map = {
            0: "Application",
            1: "Online Assessment",
            2: "Technical Interview",
            3: "Behavioral Interview",
            4: "System Design",
            5: "HR Interview",
            6: "Team Match",
        }

        # Get all interview posts for this user
        posts = Post.objects.filter(user=obj.user, post_type='interview')
        interview_posts = InterviewPost.objects.filter(post__in=posts)
        
        # Count by round_number
        counter = Counter([ip.round_number for ip in interview_posts])
        
        # Return data in the format expected by the frontend
        return [
            {"name": round_number_map.get(key, f"Round {key}"), "value": value}
            for key, value in counter.items()
        ]
    
    def get_job_records(self, obj):
        posts = Post.objects.filter(user=obj.user, post_type='interview')
        result = []
        for post in posts:
            interview = post.interview_details
            result.append({
                "id": post.id,
                "company": post.company,
                "position": post.position,
                "interview_date": post.interview_date,
                "interview_details": {
                    "round_number": getattr(interview, "round_number", None),
                }
            })
        return result





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
        request = self.context.get('request')
        if not obj.company or not obj.position:
            return []  

        related_posts = Post.objects.filter(
            user=obj.user,
            company=obj.company,
            position=obj.position
        ).order_by('interview_date', 'created_at')
        if request and request.user != obj.user:
            related_posts = related_posts.filter(visibility='public')

        return [
            {
                'id': post.id,
                'title': post.title,
                'interview_date': post.interview_date,
                'round_number': getattr(getattr(post, 'interview_details', None), 'round_number', None),
                'round_type': getattr(getattr(post, 'interview_details', None), 'round_type', None),
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
            'likes_count', 'comments_count', 'interview_details', 'visibility'
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