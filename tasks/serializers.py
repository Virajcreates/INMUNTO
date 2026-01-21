from rest_framework import serializers
from .models import Task, TaskDependency

class TaskSerializer(serializers.ModelSerializer):
    dependencies = serializers.SerializerMethodField()
    total_estimated_time = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'status', 'priority', 'estimated_time', 'created_at', 'updated_at', 'dependencies', 'total_estimated_time']

    def get_dependencies(self, obj):
        # Return list of IDs of tasks that 'obj' depends on
        return obj.dependencies.values_list('depends_on_id', flat=True)

    def get_total_estimated_time(self, obj):
        """
        Recursive calculation of total estimated time (Critical Path).
        Time = Own Time + Max(Dependencies' Total Time)
        """
        # Avoid infinite recursion if there are cycles (though we prevent them on write)
        # For read, we can just do a simple recursion.
        # Ideally, we should memoize or do it on the model, but for 20-30 tasks this is fine.
        
        # Optimization: To avoid N+1 queries during serialization of a list, 
        # normally we'd prefetch. But for simplicity here, we'll do naive recursion.
        # Be aware of performance on large graphs.
        
        own_time = obj.estimated_time
        dependencies = obj.dependencies.all() # These are TaskDependency objects where task=obj
        
        if not dependencies.exists():
             return own_time
             
        max_dependency_time = 0
        for dep_rel in dependencies:
            dep_task = dep_rel.depends_on
            # Recursively get total time of dependency
            # We can't use serializer here easily, so we call a helper or duplicate logic.
            # Best to move logic to Model method? 
            # Let's call a minimal helper function or just access property if I added one.
            # But I didn't add property to model.
            # Let's use a helper method inside serializer class.
            t = self._calculate_total_time(dep_task)
            if t > max_dependency_time:
                max_dependency_time = t
                
        return own_time + max_dependency_time

    def _calculate_total_time(self, task, visited=None):
        if visited is None:
            visited = set()
        
        if task.id in visited:
            return 0 # Cycle break
        visited.add(task.id)

        own = task.estimated_time
        deps = task.dependencies.all()
        
        if not deps.exists():
            return own
            
        max_dep = 0
        for d in deps:
            val = self._calculate_total_time(d.depends_on, visited)
            if val > max_dep:
                max_dep = val
        
        visited.remove(task.id)
        return own + max_dep

class TaskDependencySerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskDependency
        fields = ['id', 'task', 'depends_on', 'created_at']
