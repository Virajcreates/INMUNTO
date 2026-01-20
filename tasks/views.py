from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Task, TaskDependency
from .serializers import TaskSerializer, TaskDependencySerializer
from .services import detect_cycle, update_task_status

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def perform_update(self, serializer):
        task = serializer.save()
        # If status changed manually, we might need to propagate?
        # Requirement: "When a task is marked 'completed', update all tasks that depend on it."
        update_task_status(task) # This checks dependencies OF this task, but we need to check tasks depending ON this task.
        # Ideally update_task_status should handle propagation. 
        # My implementation of update_task_status(task) updates 'task' based on ITS dependencies.
        # Then it propagates to tasks that depend on 'task'.
        # So calling it here for the current task will just verify its own state (e.g. valid transition)
        # AND propagate to children.
        
        # However, logic in update_task_status re-evaluates 'task.status' based on dependencies.
        # If user manually sets 'completed', we want to KEEP it completed (unless we enforce strict logic).
        # Let's assume manual override is allowed, but we must propagate the effect to children.
        
        # Propagate to required_by
        for rel in task.required_by.all():
            update_task_status(rel.task)

    @action(detail=True, methods=['post'], url_path='dependencies')
    def add_dependency(self, request, pk=None):
        task = self.get_object()
        depends_on_id = request.data.get('depends_on_id')
        
        if not depends_on_id:
            return Response({"error": "depends_on_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        if str(task.id) == str(depends_on_id):
             return Response({"error": "Cannot depend on self"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            depends_on_task = Task.objects.get(id=depends_on_id)
        except Task.DoesNotExist:
            return Response({"error": "Dependency task not found"}, status=status.HTTP_404_NOT_FOUND)

        # Check for existing dependency
        if TaskDependency.objects.filter(task=task, depends_on=depends_on_task).exists():
            return Response({"error": "Dependency already exists"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Detect Cycle
        has_cycle, path = detect_cycle(task, depends_on_task)
        if has_cycle:
            return Response({
                "error": "Circular dependency detected",
                "path": path
            }, status=status.HTTP_400_BAD_REQUEST)

        # 2. Create Dependency
        TaskDependency.objects.create(task=task, depends_on=depends_on_task)
        
        # 3. Update Status
        # The task adding the dependency might need a status update (e.g. pending -> blocked)
        update_task_status(task)

        return Response({"status": "Dependency added"}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='dependencies/(?P<dependency_id>[^/.]+)')
    def remove_dependency(self, request, pk=None, dependency_id=None):
        # NOTE: dependency_id here refers to the ID of the DEPENDENCY implementation (TaskDependency.id)?
        # Or the ID of the task we want to remove dependency ON?
        # API design usually implies sub-resource ID. 
        # Let's assume dependency_id is the TaskDependency ID or we handle it via Query param / Body?
        # "DELETE /api/tasks/{task_id}/dependencies/" implies we might send body? 
        # But DELETE with body is discouraged.
        # Better: DELETE /api/tasks/{task_id}/dependencies/{depends_on_task_id}/
        
        task = self.get_object()
        
        # Let's support depends_on_task_id passed in URL as 'dependency_id' argument
        # Assuming URL pattern catches it.
        
        try:
             # Try to interpret dependency_id as the ID of the TARGET TASK
            depends_on_task = Task.objects.get(id=dependency_id)
            dependency = TaskDependency.objects.filter(task=task, depends_on=depends_on_task).first()
        except (Task.DoesNotExist, ValueError):
            # Or maybe it is the TaskDependency ID itself?
            dependency = get_object_or_404(TaskDependency, id=dependency_id, task=task)

        if dependency:
            dependency.delete()
            # Update status as we might be unblocked now
            update_task_status(task)
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        return Response(status=status.HTTP_404_NOT_FOUND)
