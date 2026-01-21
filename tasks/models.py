from django.db import models

class Task(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('blocked', 'Blocked'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.IntegerField(default=3, choices=[(i, i) for i in range(1, 6)])
    estimated_time = models.IntegerField(default=0, help_text="Estimated time in hours")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class TaskDependency(models.Model):
    task = models.ForeignKey(Task, related_name='dependencies', on_delete=models.CASCADE)
    depends_on = models.ForeignKey(Task, related_name='required_by', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('task', 'depends_on')

    def __str__(self):
        return f"{self.task.title} depends on {self.depends_on.title}"
