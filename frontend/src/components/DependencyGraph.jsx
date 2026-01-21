import React, { useMemo } from 'react';

const NODE_WIDTH = 120;
const NODE_HEIGHT = 40;
const LEVEL_HEIGHT = 100;
const NODE_SPACING = 20;

const DependencyGraph = ({ tasks }) => {
    // Determine layout
    const { nodes, edges, width, height } = useMemo(() => {
        if (!tasks || tasks.length === 0) return { nodes: [], edges: [], width: 600, height: 400 };

        // 1. Calculate Levels (Depth)
        const levels = {}; // taskId -> level
        const taskMap = {};
        tasks.forEach(t => {
            taskMap[t.id] = t;
            levels[t.id] = 0;
        });

        let changed = true;
        let iterations = 0;
        const maxLevel = tasks.length + 1; // Basic safeguards against cycles (though backend prevents them)

        while (changed && iterations < maxLevel) {
            changed = false;
            iterations++;
            tasks.forEach(task => {
                task.dependencies.forEach(depId => {
                    // Task depends on Dep. So Task should be below Dep.
                    // level[task] = max(level[task], level[dep] + 1)
                    if (levels[depId] !== undefined) {
                        if (levels[task.id] < levels[depId] + 1) {
                            levels[task.id] = levels[depId] + 1;
                            changed = true;
                        }
                    }
                });
            });
        }

        // 2. Group by Level and Assign X Positions
        const tasksByLevel = {};
        let maxLevelFound = 0;
        tasks.forEach(t => {
            const l = levels[t.id];
            maxLevelFound = Math.max(maxLevelFound, l);
            if (!tasksByLevel[l]) tasksByLevel[l] = [];
            tasksByLevel[l].push(t);
        });

        const nodes = [];
        const edges = [];
        const canvasWidth = Math.max(600, tasks.length * (NODE_WIDTH / 2));
        // Better width calc: max(items in level) * (width+spacing)

        Object.keys(tasksByLevel).forEach(level => {
            const levelTasks = tasksByLevel[level];
            const parsedLevel = parseInt(level);
            const totalWidth = levelTasks.length * NODE_WIDTH + (levelTasks.length - 1) * NODE_SPACING;
            let startX = (canvasWidth - totalWidth) / 2;

            // If canvas is too small, expand startX (will be negative relative to center, maybe just align left if overflow?)
            if (startX < 20) startX = 20;

            levelTasks.forEach((task, index) => {
                const x = startX + index * (NODE_WIDTH + NODE_SPACING);
                const y = 40 + parsedLevel * LEVEL_HEIGHT;

                nodes.push({
                    id: task.id,
                    x, y,
                    title: task.title,
                    status: task.status
                });
            });
        });

        // 3. Generate Edges
        tasks.forEach(task => {
            task.dependencies.forEach(depId => {
                const sourceNode = nodes.find(n => n.id === depId); // Dependency (Top)
                const targetNode = nodes.find(n => n.id === task.id); // Dependent (Bottom)

                if (sourceNode && targetNode) {
                    edges.push({
                        id: `${depId}-${task.id}`,
                        x1: sourceNode.x + NODE_WIDTH / 2,
                        y1: sourceNode.y + NODE_HEIGHT,
                        x2: targetNode.x + NODE_WIDTH / 2,
                        y2: targetNode.y,
                        sourceStatus: sourceNode.status
                    });
                }
            });
        });

        return {
            nodes,
            edges,
            width: Math.max(canvasWidth, 600),
            height: Math.max((maxLevelFound + 1) * LEVEL_HEIGHT + 100, 400)
        };
    }, [tasks]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return '#d1fae5'; // green-100
            case 'blocked': return '#fee2e2'; // red-100
            case 'in_progress': return '#dbeafe'; // blue-100
            default: return '#f3f4f6'; // gray-100
        }
    };

    const getStrokeColor = (status) => {
        switch (status) {
            case 'completed': return '#10b981'; // green-500
            case 'blocked': return '#ef4444'; // red-500
            case 'in_progress': return '#3b82f6'; // blue-500
            default: return '#9ca3af'; // gray-400
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow overflow-auto">
            <h2 className="text-xl font-bold mb-4">Dependency Graph</h2>
            {tasks.length === 0 ? (
                <p className="text-gray-500">No tasks to visualize.</p>
            ) : (
                <svg width={width} height={height}>
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7"
                            refX="10" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
                        </marker>
                    </defs>

                    {/* Edges */}
                    {edges.map(edge => (
                        <line
                            key={edge.id}
                            x1={edge.x1} y1={edge.y1}
                            x2={edge.x2} y2={edge.y2}
                            stroke="#9ca3af"
                            strokeWidth="2"
                            markerEnd="url(#arrowhead)"
                        />
                    ))}

                    {/* Nodes */}
                    {nodes.map(node => (
                        <g key={node.id}>
                            <rect
                                x={node.x} y={node.y}
                                width={NODE_WIDTH} height={NODE_HEIGHT}
                                rx="5" ry="5"
                                fill={getStatusColor(node.status)}
                                stroke={getStrokeColor(node.status)}
                                strokeWidth="2"
                            />
                            <text
                                x={node.x + NODE_WIDTH / 2}
                                y={node.y + NODE_HEIGHT / 2}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="12"
                                fontWeight="500"
                                fill="#1f2937"
                                style={{ pointerEvents: 'none' }} // Allow clicks pass through if needed
                            >
                                {node.title.length > 15 ? node.title.substring(0, 12) + '...' : node.title}
                            </text>
                        </g>
                    ))}
                </svg>
            )}
        </div>
    );
};

export default DependencyGraph;
