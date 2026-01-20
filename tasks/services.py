from .models import Task, TaskDependency
from django.db import transaction

def detect_cycle(source_task, target_task):
    """
    Detects if adding a dependency (source_task -> target_task) creates a cycle.
    Do DFS starting from target_task to see if we can reach source_task.
    Returns (has_cycle, path)
    """
    visited = set()
    path = []
    
    def dfs(current_task):
        visited.add(current_task.id)
        path.append(current_task.id)
        
        if current_task.id == source_task.id:
            return True
            
        # Get all tasks that current_task depends on
        # TaskDependency: task -> depends_on
        # We are following the dependency chain: A depends on B, B depends on C
        dependencies = TaskDependency.objects.filter(task=current_task)
        for dep in dependencies:
            if dep.depends_on.id not in visited:
                if dfs(dep.depends_on):
                    return True
        
        path.pop()
        return False

    # Check if a cycle would be created
    if dfs(target_task):
        # The path led us back to source_task.
        # Construct full path for display: source -> ... -> source
        full_path = [source_task.id] + path
        return True, full_path
        
    return False, []

def update_task_status(task):
    """
    Updates the status of a task based on its dependencies.
    Triggers recursively for tasks that depend on this task.
    """
    dependencies = task.dependencies.all() 
    
    status_changed = False
    
    # Only auto-update status if there are upstream dependencies.
    # If no dependencies, the Task is a leaf node (start of graph), so status is manual.
    if dependencies.exists():
        all_completed = True
        any_blocked = False
        
        for dep_rel in dependencies:
            dep_task = dep_rel.depends_on
            if dep_task.status == 'blocked':
                any_blocked = True
            if dep_task.status != 'completed':
                all_completed = False
                
        original_status = task.status
        new_status = original_status

        if any_blocked:
            new_status = 'blocked'
        elif all_completed:
            # If all dependencies are 'completed' -> set status to 'in_progress' (ready to work).
            if original_status in ['pending', 'blocked']:
                new_status = 'in_progress'
        else:
            # Pending/Mixed state
            if original_status == 'in_progress':
                 new_status = 'pending'

        if new_status != original_status:
            task.status = new_status
            task.save()
            status_changed = True
    
    # Always propagate checks to dependent tasks (children)
    # This ensures that if this task was manually updated (e.g. leaf node marked completed),
    # the children are notified.
    dependent_relationships = task.required_by.all()
    for rel in dependent_relationships:
        update_task_status(rel.task)
