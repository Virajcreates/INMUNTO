import React, { useState, useEffect } from 'react';
import api from './services/api';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import DependencyGraph from './components/DependencyGraph';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks/');
      // We need dependencies usually expanded or as IDs. 
      // The current serializer maps fields='__all__', which likely creates 'dependencies' as PKs?
      // Wait, Task model has related_name='dependencies' from TaskDependency.task.
      // But TaskDependency.task points to the dependent task. This is confusing.
      // TaskDependency: task (dependent) -> depends_on (dependency).

      // Let's verify serializer output. 
      // TaskSerializer with fields='__all__' will include 'dependencies' (reverse relation)?
      // No, reverse relations for ForeignKeys are NOT included by default in ModelSerializer unless specified.
      // I probably need to update the serializer to include the list of dependency IDs.

      setTasks(response.data);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Task Dependency Tracker</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Management */}
          <div>
            <TaskForm onTaskCreated={fetchTasks} />
            {loading ? <p>Loading...</p> : (
              <TaskList
                tasks={tasks}
                onUpdate={fetchTasks}
                onDelete={fetchTasks}
              />
            )}
          </div>

          {/* Right Column: Visualization */}
          <div className="lg:sticky lg:top-8 h-fit">
            <DependencyGraph tasks={tasks} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
