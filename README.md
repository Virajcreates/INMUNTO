# Task Dependency and Status Tracker (Backend)

## Setup

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```
   *Note: Ensure you have `mysqlclient` requirements installed on your OS if using MySQL.*

2. **Database Configuration**
   By default, the project uses **SQLite** for development ease.
   To use **MySQL**, set the following environment variables:
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_HOST`
   - `DB_PORT`

3. **Migrations**
   ```bash
   python manage.py makemigrations tasks
   python manage.py migrate
   ```

4. **Run Server**
   ```bash
   python manage.py runserver
   ```

## API Endpoints

### Tasks
- `GET /api/tasks/` - List all tasks
- `POST /api/tasks/` - Create a task
- `GET /api/tasks/{id}/` - Retrieve a task
- `PUT/PATCH /api/tasks/{id}/` - Update a task
- `DELETE /api/tasks/{id}/` - Delete a task

### Dependencies
- `POST /api/tasks/{id}/dependencies/` - Add a dependency
    - Body: `{"depends_on_id": <id>}`
- `DELETE /api/tasks/{id}/dependencies/{dependency_id}/` - Remove a dependency
    - Note: `dependency_id` in the URL can be the ID of the target task you want to remove dependency on.
