import React, { useMemo, useState, useEffect, useRef } from 'react';

const NODE_WIDTH = 120;
const NODE_HEIGHT = 40;
const LEVEL_HEIGHT = 100;
const NODE_SPACING = 20;

const DependencyGraph = ({ tasks }) => {
    const svgRef = useRef(null);
    const [nodePositions, setNodePositions] = useState({});
    const [dragging, setDragging] = useState(null); // { id, startX, startY, mouseX, mouseY }

    // Calculate initial layout
    const calculatedLayout = useMemo(() => {
        if (!tasks || tasks.length === 0) return { nodes: [], width: 600, height: 400 };

        const levels = {};
        const taskMap = {};
        tasks.forEach(t => {
            taskMap[t.id] = t;
            levels[t.id] = 0;
        });

        let changed = true;
        let iterations = 0;
        const maxLevel = tasks.length + 1;

        while (changed && iterations < maxLevel) {
            changed = false;
            iterations++;
            tasks.forEach(task => {
                task.dependencies.forEach(depId => {
                    if (levels[depId] !== undefined) {
                        if (levels[task.id] < levels[depId] + 1) {
                            levels[task.id] = levels[depId] + 1;
                            changed = true;
                        }
                    }
                });
            });
        }

        const tasksByLevel = {};
        let maxLevelFound = 0;
        tasks.forEach(t => {
            const l = levels[t.id];
            maxLevelFound = Math.max(maxLevelFound, l);
            if (!tasksByLevel[l]) tasksByLevel[l] = [];
            tasksByLevel[l].push(t);
        });

        const initialNodes = [];
        const canvasWidth = Math.max(600, tasks.length * (NODE_WIDTH / 2));

        Object.keys(tasksByLevel).forEach(level => {
            const levelTasks = tasksByLevel[level];
            const parsedLevel = parseInt(level);
            const totalWidth = levelTasks.length * NODE_WIDTH + (levelTasks.length - 1) * NODE_SPACING;
            let startX = (canvasWidth - totalWidth) / 2;
            if (startX < 20) startX = 20;

            levelTasks.forEach((task, index) => {
                const x = startX + index * (NODE_WIDTH + NODE_SPACING);
                const y = 40 + parsedLevel * LEVEL_HEIGHT;
                initialNodes.push({ id: task.id, x, y });
            });
        });

        return {
            nodes: initialNodes,
            width: Math.max(canvasWidth, 600),
            height: Math.max((maxLevelFound + 1) * LEVEL_HEIGHT + 100, 400)
        };
    }, [tasks]);

    // Update positions when tasks change, preserving overrides if possible?
    // For simplicity, we merge calculated layout with overrides, but priority given to overrides.
    // Actually, on task change (add/remove), we probably want to re-layout OR keep existing.
    // Let's reset if tasks length changes significantly, but this is a simple demo.

    // We construct the final nodes for rendering
    const nodes = useMemo(() => {
        return calculatedLayout.nodes.map(n => ({
            ...n,
            ...(nodePositions[n.id] || {}) // Override with drag position
        }));
    }, [calculatedLayout, nodePositions]);

    const edges = useMemo(() => {
        const edgeList = [];
        tasks.forEach(task => {
            const targetNode = nodes.find(n => n.id === task.id);
            if (!targetNode) return;

            task.dependencies.forEach(depId => {
                const sourceNode = nodes.find(n => n.id === depId);
                if (sourceNode) {
                    edgeList.push({
                        id: `${depId}-${task.id}`,
                        x1: sourceNode.x + NODE_WIDTH / 2,
                        y1: sourceNode.y + NODE_HEIGHT,
                        x2: targetNode.x + NODE_WIDTH / 2,
                        y2: targetNode.y,
                        sourceStatus: tasks.find(t => t.id === depId)?.status
                    });
                }
            });
        });
        return edgeList;
    }, [tasks, nodes]);

    // Drag Handlers
    const handleMouseDown = (e, id) => {
        e.preventDefault();
        const node = nodes.find(n => n.id === id);
        setDragging({
            id,
            startX: node.x,
            startY: node.y,
            mouseX: e.clientX,
            mouseY: e.clientY
        });
    };

    const handleMouseMove = (e) => {
        if (!dragging) return;
        const dx = e.clientX - dragging.mouseX;
        const dy = e.clientY - dragging.mouseY;

        setNodePositions(prev => ({
            ...prev,
            [dragging.id]: {
                x: dragging.startX + dx,
                y: dragging.startY + dy
            }
        }));
    };

    const handleMouseUp = () => {
        setDragging(null);
    };

    // Export to PNG
    const handleExport = () => {
        if (!svgRef.current) return;

        const svgData = new XMLSerializer().serializeToString(svgRef.current);
        const canvas = document.createElement("canvas");
        const svgSize = svgRef.current.getBoundingClientRect();
        canvas.width = calculatedLayout.width;
        canvas.height = calculatedLayout.height;
        const ctx = canvas.getContext("2d");
        const img = new Image();

        const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);

        img.onload = () => {
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const pngUrl = canvas.toDataURL("image/png");

            const downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = "dependency_graph.png";
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        };
        img.src = url;
    };

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
        <div
            className="bg-white p-4 rounded-lg shadow overflow-auto relative"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Dependency Graph (Interactive)</h2>
                <button
                    onClick={handleExport}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-3 rounded text-sm"
                >
                    Export PNG
                </button>
            </div>

            {tasks.length === 0 ? (
                <p className="text-gray-500">No tasks to visualize.</p>
            ) : (
                <svg
                    ref={svgRef}
                    width={calculatedLayout.width}
                    height={calculatedLayout.height}
                    className="border border-gray-100 rounded"
                    style={{ cursor: dragging ? 'grabbing' : 'default' }}
                >
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
                    {nodes.map(node => {
                        const task = tasks.find(t => t.id === node.id);
                        return (
                            <g
                                key={node.id}
                                style={{ cursor: 'grab' }}
                                onMouseDown={(e) => handleMouseDown(e, node.id)}
                            >
                                <rect
                                    x={node.x} y={node.y}
                                    width={NODE_WIDTH} height={NODE_HEIGHT}
                                    rx="5" ry="5"
                                    fill={getStatusColor(task?.status)}
                                    stroke={getStrokeColor(task?.status)}
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
                                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                                >
                                    {task?.title.length > 15 ? task.title.substring(0, 12) + '...' : task?.title}
                                </text>
                                {/* Priority Badge */}
                                {task?.priority > 3 && (
                                    <circle
                                        cx={node.x + NODE_WIDTH}
                                        cy={node.y}
                                        r="8"
                                        fill={task.priority === 5 ? "#ef4444" : "#f97316"}
                                    />
                                )}
                            </g>
                        );
                    })}
                </svg>
            )}
            <p className="text-xs text-gray-400 mt-2">Drag nodes to rearrange. Orange/Red dot = High Priority.</p>
        </div>
    );
};

export default DependencyGraph;
