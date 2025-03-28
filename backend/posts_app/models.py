from django.db import models
from django.contrib.auth.models import User

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
    
    def __str__(self):
        return self.title
    
    class Meta:
        ordering = ['-created_at']

class InterviewPost(models.Model):
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
