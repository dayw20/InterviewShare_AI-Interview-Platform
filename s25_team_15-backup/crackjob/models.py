from django.db import models

# Create your models here.
class Problem(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    function_name = models.CharField(max_length=255)

    def __str__(self):
        return self.title

class TestCase(models.Model):
    problem = models.ForeignKey(Problem, related_name='test_cases', on_delete=models.CASCADE)
    input_data = models.JSONField()  
    expected_output = models.JSONField() 

    def __str__(self):
        return f"TestCase for {self.problem.title}"
