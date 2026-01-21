import React, { useState } from 'react';
import api from '../services/api';

const STATUS_COLORS = {
    pending: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    blocked: 'bg-red-100 text-red-800',
};

const TaskList = ({ tasks, onUpdate, onDelete }) => {
    const [addingDep, setAddingDep] = useState(null); // Task ID we are adding dependency TO
    const [selectedDepId, setSelectedDepId] = useState('');
    const [error, setError] = useState(null);

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await api.patch(`/tasks/${taskId}/`, { status: newStatus });
            onUpdate();
        } catch (err) {
            console.error("Failed to update status", err);
            alert("Failed to update status");
        }
    };

    const handleDelete = async (taskId) => {
        if (!window.confirm("Are you sure? This might affect dependent tasks.")) return;
        try {
            await api.delete(`/tasks/${taskId}/`);
            onDelete();
        } catch (err) {
            console.error("Failed to delete task", err);
            alert("Failed to delete task");
        }
    };

    const handleAddDependency = async (taskId) => {
        if (!selectedDepId) return;
        setError(null);
        try {
            await api.post(`/tasks/${taskId}/dependencies/`, { depends_on_id: selectedDepId });
            setAddingDep(null);
            setSelectedDepId('');
            onUpdate();
        } catch (err) {
            if (err.response && err.response.data && err.response.data.error) {
                // Formatting circular dependency error nicely
                const msg = err.response.data.error;
                const path = err.response.data.path ? ` Path: ${err.response.data.path.join(' -> ')}` : '';
                setError(`${msg}${path}`);
            } else {
                setError("Failed to add dependency");
            }
        }
    };

    const handleRemoveDependency = async (taskId, depId) => {
        if (!window.confirm("Remove this dependency?")) return;
        try {
            await api.delete(`/tasks/${taskId}/dependencies/${depId}/`);
            onUpdate();
        } catch (err) {
            console.error(err);
            alert("Failed to remove dependency");
        }
    };

    return (
        <div className="space-y-4">
            {tasks.map(task => (
                <div key={task.id} className={`bg-white p-4 rounded-lg shadow border-l-4 ${task.status === 'completed' ? 'border-green-500' :
                    task.status === 'blocked' ? 'border-red-500' :
                        task.status === 'in_progress' ? 'border-blue-500' : 'border-gray-300'
                    }`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-semibold">{task.title}</h3>
                            <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                            <div className="mt-2 flex items-center space-x-2">
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${STATUS_COLORS[task.status]}`}>
                                    {task.status.replace('_', ' ').toUpperCase()}
                                </span>
                                <select
                                    value={task.status}
                                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                    className="text-xs border rounded p-1"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="blocked">Blocked</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setAddingDep(task.id === addingDep ? null : task.id)}
                                className="text-indigo-600 hover:text-indigo-900 text-sm"
                            >
                                {task.id === addingDep ? 'Cancel' : '+ Dependency'}
                            </button>
                            <button
                                onClick={() => handleDelete(task.id)}
                                className="text-red-600 hover:text-red-900 text-sm"
                            >
                                Delete
                            </button>
                        </div>
                    </div>

                    {/* Dependencies List */}
                    {task.dependencies && task.dependencies.length > 0 && (
                        <div className="mt-3 text-sm">
                            <span className="font-medium text-gray-700">Depends on: </span>
                            {task.dependencies.map(depId => {
                                const depTask = tasks.find(t => t.id === depId);
                                return (
                                    <span key={depId} className="inline-flex items-center bg-gray-100 rounded px-2 py-0.5 ml-2">
                                        {depTask ? depTask.title : depId}
                                        <button
                                            onClick={() => handleRemoveDependency(task.id, depId)}
                                            className="ml-1 text-red-500 hover:text-red-700"
                                        >
                                            &times;
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    {/* Add Dependency Input */}
                    {addingDep === task.id && (
                        <div className="mt-3 bg-gray-50 p-2 rounded">
                            <p className="text-xs font-medium mb-1">Select task to depend on:</p>
                            {error && <p className="text-xs text-red-600 mb-1">{error}</p>}
                            <div className="flex space-x-2">
                                <select
                                    value={selectedDepId}
                                    onChange={(e) => setSelectedDepId(e.target.value)}
                                    className="text-sm border rounded p-1 flex-1"
                                >
                                    <option value="">Select Task...</option>
                                    {tasks.filter(t => t.id !== task.id).map(t => (
                                        <option key={t.id} value={t.id}>{t.title} ({t.status})</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => handleAddDependency(task.id)}
                                    disabled={!selectedDepId}
                                    className="bg-indigo-600 text-white text-xs px-3 py-1 rounded disabled:opacity-50"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
            {tasks.length === 0 && <p className="text-center text-gray-500">No tasks found. Create one above!</p>}
        </div>
    );
};

export default TaskList;
