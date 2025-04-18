from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    total_post_views = models.PositiveIntegerField(default=0)
    total_likes = models.PositiveIntegerField(default=0)
    posts_count = models.PositiveIntegerField(default=0)
    activity_count = models.PositiveIntegerField(default=0) 
    exp = models.PositiveIntegerField(default=0)
    followers = models.ManyToManyField('self', symmetrical=False, related_name='following', blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)


    def __str__(self):
        return self.user.username
    
    def followers_count(self):
        return self.followers.count()

    def following_count(self):
        return self.user.profile.following.count()
    

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

class Post(models.Model):
    POST_TYPE_CHOICES = [
        ('interview', 'Interview Experience'),
        ('general', 'General Discussion'),
        ('company_review', 'Company Review'),
        ('resume_submission', 'Resume Submission'),
        ('personal_record', 'Personal Record'),
    ]
    
    VISIBILITY_CHOICES = [
        ('public', 'Public'),
        ('private', 'Private'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    post_type = models.CharField(max_length=20, choices=POST_TYPE_CHOICES)
    title = models.CharField(max_length=255)
    content = models.TextField()
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default='public')
    company = models.CharField(max_length=100, null=True, blank=True)
    interview_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    views = models.PositiveIntegerField(default=0)
    position = models.CharField(max_length=255, blank=True, null=True)


    
    def __str__(self):
        return self.title
    
    class Meta:
        ordering = ['-created_at']

class InterviewPost(models.Model):
    STATUS_CHOICES = [
        ('pass', 'Pass'),
        ('fail', 'Fail'),
        ('pending', 'Pending'),
    ]

    ROUND_TYPE_CHOICES = [
        ('online_assessment', 'Online Assessment'),
        ('technical_interview', 'Technical Interview'),
        ('hr_interview', 'HR Interview'),
        ('system_design', 'System Design'),
        ('behavioral', 'Behavioral Interview'),
    ]
    
    post = models.OneToOneField(Post, on_delete=models.CASCADE, primary_key=True, related_name='interview_details')
    round_number = models.IntegerField()
    round_type = models.CharField(max_length=30, choices=ROUND_TYPE_CHOICES)
    position = models.CharField(max_length=50, default='Unknown')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')  

    
    def __str__(self):
        return f"{self.post.title} - Round {self.round_number}: {self.get_round_type_display()}"

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    parent_comment = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Comment by {self.user.username} on {self.post.title}"
    
    class Meta:
        ordering = ['created_at']

class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'post')

# ai mock lab
class Problem(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    title = models.CharField(max_length=255)
    description = models.TextField()
    function_name = models.CharField(max_length=255)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='easy')

    def __str__(self):
        return self.title

class ProblemSolveLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE)
    solved_at = models.DateTimeField(auto_now_add=True)
    passed = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'problem')

class TestCase(models.Model):
    problem = models.ForeignKey(Problem, related_name='test_cases', on_delete=models.CASCADE)
    input_data = models.JSONField()  
    expected_output = models.JSONField() 

    def __str__(self):
        return f"TestCase for {self.problem.title}"
