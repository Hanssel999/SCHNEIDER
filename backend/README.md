# Django backend

This backend is designed to run locally without Docker. SQLite is the default database; PostgreSQL can be selected with `DB_ENGINE=postgresql`.

## Setup

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The API is available at `http://localhost:8000/api/`.

## Auth endpoints

- `POST /api/auth/signup/`
- `POST /api/auth/signin/`
- `POST /api/auth/token/refresh/`

## Structure

- `config/`: Django project configuration and URL routing
- `apps/users/`: user domain, serializers, repository, service, and HTTP views
- `common/`: shared response helpers
