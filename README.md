# Task Dependency and Status Tracker

A Full Stack application to manage project tasks, enforce dependency rules, and visualize workflows.

## Features

### Core Features
- **Task Management**: Create, Read, Update, Delete (CRUD) tasks.
- **Dependency Management**: Link tasks together (`Task A` depends on `Task B`).
- **Circular Dependency Detection**: Prevents adding a dependency that creates a cycle (e.g., A -> B -> A). Returns the exact cycle path.
- **Auto Status Propagation**:
  - **Unlock**: Completing a dependency automatically moves the dependent task to "In Progress".
  - **Block**: Blocking a dependency automatically marks the dependent task as "Blocked".

### Bonus Features (Implemented)
- **Priority System**: 1-5 scale with visual indicators (Critical/High/Medium/Low).
- **Time Estimation**: Calculates "Total Time" using Critical Path Method (Own Time + Max Chain Time).
- **Search & Filter**: Real-time filtering by Title and Status.
- **Interactive Graph**: Custom SVG graph with Drag-and-Drop nodes.
- **Graph Export**: Download the dependency graph as a PNG image.

---

## Tech Stack
- **Backend**: Django, Django REST Framework, SQLite (Dev) / MySQL (Prod).
- **Frontend**: React (Vite), Tailwind CSS, Axios.

---

## Setup Instructions

### 1. Backend (Django)

1. Navigate to the root folder:
   ```bash
   cd TaskTracker
   ```
2. Create and activate virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # Mac/Linux
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run Migrations:
   ```bash
   python manage.py makemigrations tasks
   python manage.py migrate
   ```
5. Start Server:
   ```bash
   python manage.py runserver
   ```
   *Server running at: http://127.0.0.1:8000/*

### 2. Frontend (React)

1. Navigate to frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Dev Server:
   ```bash
   npm run dev
   ```
4. Open Application:
   *Visit http://localhost:5173/*

---

## API Documentation

### Tasks
- `GET /api/tasks/`: List all tasks (with calculated `total_estimated_time`).
- `POST /api/tasks/`: Create new task.
  - Body: `{ "title": "...", "description": "...", "priority": 5, "estimated_time": 2 }`
- `PATCH /api/tasks/{id}/`: Update task (e.g., Status).
- `DELETE /api/tasks/{id}/`: Delete task.

### Dependencies
- `POST /api/tasks/{id}/dependencies/`: Add dependency.
  - Body: `{ "depends_on_id": <id> }`
- `DELETE /api/tasks/{id}/dependencies/{dependency_id}/`: Remove dependency.
