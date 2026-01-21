from rest_framework import serializers
from .models import Task, TaskDependency

class TaskSerializer(serializers.ModelSerializer):
    dependencies = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'status', 'created_at', 'updated_at', 'dependencies']

    def get_dependencies(self, obj):
        # Return list of IDs of tasks that 'obj' depends on
        return obj.dependencies.values_list('depends_on_id', flat=True)

class TaskDependencySerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskDependency
        fields = ['id', 'task', 'depends_on', 'created_at']
