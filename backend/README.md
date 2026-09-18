# Django backend

This backend uses the PostgreSQL database defined in the root Docker Compose file. SQLite is no longer the default.

## Setup

```powershell
cd ..
docker compose up -d db

cd backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The local Django process connects to the Compose database at `127.0.0.1:5432`. If Django itself runs inside Docker, use `DB_HOST=db` instead.

The API is available at `http://localhost:8000/api/`.

## Auth endpoints

- `POST /api/auth/signup/`
- `POST /api/auth/signin/`
- `POST /api/auth/token/refresh/`

## Structure

- `config/`: Django project configuration and URL routing
- `apps/users/`: user domain, serializers, repository, service, and HTTP views
- `common/`: shared response helpers
