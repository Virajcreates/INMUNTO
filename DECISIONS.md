# DECISIONS.md

## Circular Dependency Detection

For detecting circular dependencies, I implemented a **Depth-First Search (DFS)** algorithm.

### Why DFS?
- **Cycle Detection**: DFS is the standard and efficient way to detect cycles in a directed graph.
- **Path Reconstruction**: The requirement was not just to return True/False, but to return the *path* of the cycle (e.g., `[1, 3, 5, 1]`). DFS naturally maintains the recursion stack (or a path list), making it trivial to return the exact sequence of nodes that form the cycle.
- **Simplicity**: Given the likely graph size (tasks in a project), an iterative or recursive DFS is performant enough and easy to understand. Using algorithms like Tarjan's or Kahn's (for topological sort) would be overkill or less direct for simply pointing out *the specific cycle* created by a new edge.

### Implementation Details
- The check is performed *before* creating the dependency record in the database.
- We check if adding an edge `A -> B` creates a cycle. This is equivalent to checking if there is already a path from `B` to `A`.
- If a path `B -> ... -> A` exists, adding `A -> B` closes the loop.
- The algorithm searches starting from `B` (depends_on_task). If it encounters `A` (task), a cycle is confirmed.

## Status Update Logic

The status update logic is event-driven based on two triggers:
1. **Manual Update**: User updates a task status (e.g., marks a leaf task as "Completed").
2. **Propagation**: When a task's status changes, it recursively checks all tasks that depend on it (`required_by`).

### Rules Enforcement
- **Blocked**: If ANY dependency is 'blocked', the dependent task becomes 'blocked'.
- **In Progress**: If ALL dependencies are 'completed', a 'pending' or 'blocked' task becomes 'in_progress'.
- **Pending**: If dependencies exist but are mixed/incomplete, the task remains or reverts to 'pending'.

### Propagation Strategy
We use a **Recursive Propagation** (Depth-First) approach.
- When `Task A` updates, we find all `Task B`s that depend on `A`.
- We re-evaluate `Task B`.
- If `Task B` changes, we find all `Task C`s that depend on `B`, and so on.
- Since we prevent cycles at creation time, this propagation is guaranteed to terminate (DAG).
