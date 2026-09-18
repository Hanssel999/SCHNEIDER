# SCHNEIDER

## Stack

- Backend: Django, Django REST Framework, SimpleJWT
- Database: PostgreSQL 17
- Frontend: TypeScript React

## Backend setup

From the repository root, start PostgreSQL:

```powershell
docker compose up -d db
```

The checked-in backend virtual environment already contains the required packages. For a fresh environment:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Apply the schema and start Django:

```powershell
cd backend
Copy-Item .env.example .env
python manage.py migrate
python manage.py runserver
```

The API is available at `http://localhost:8000/api/`.

## Authentication API

`POST /api/auth/signup/` accepts `email`, `first_name`, `last_name`, `password`, `password_confirm`, and `role`. Public signup supports `driver` and `manager`.

`POST /api/auth/signin/` accepts `email` and `password`, returning `access`, `refresh`, and the authenticated `user` object. Access tokens last 30 minutes and refresh tokens last 7 days.

Super managers are not publicly self-assignable. Create one explicitly after migrations:

```powershell
python manage.py create_super_manager --email admin@company.com --first-name System --last-name Admin --password "use-a-strong-password"
```

Run backend checks and tests with:

```powershell
python manage.py check
python manage.py test
```
