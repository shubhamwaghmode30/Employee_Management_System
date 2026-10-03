# Employee Management System

A role-based employee management system with a Python REST API and a planned React (Expo) client. The application provides role-based access control for managing employee records with support for full-time and contract employment types.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Python 3.12+, FastAPI, Pydantic v2 |
| Database | SQLAlchemy 2.0, Alembic, SQLite (dev), PostgreSQL (via DATABASE_URL) |
| Testing | pytest, httpx |
| Tooling | ruff, strict mypy |
| Planned | JWT authentication, argon2 password hashing, React Expo frontend |

## What is Implemented

- App factory with environment-based settings
- Health endpoint at `/api/v1/health`
- Database layer with SQLAlchemy ORM and Alembic migrations
- Domain layer with enums (EmploymentType, RoleName, Permission), role policies (Admin, HR Manager, Employee), and domain exceptions
- Role model with unique role names
- Polymorphic Employee model with single-table inheritance (FullTimeEmployee, ContractEmployee)
- Initial Alembic migration for roles and employees tables
- 18 unit tests covering domain primitives, employee model, and health endpoint

## Architecture

The backend follows a layered architecture: HTTP routers parse requests and call services, services contain business rules and depend on repository abstractions, repositories handle database access, and ORM models map to database tables. This separation allows for testable, maintainable code with clear boundaries between layers.

## Project Structure

```
backend/
├── alembic/
│   ├── versions/
│   │   └── a6193a57a1ea_initial_migration_for_roles_and_.py
│   ├── env.py
│   └── script.py.mako
├── app/
│   ├── api/
│   │   └── health.py
│   ├── core/
│   │   ├── database.py
│   │   └── settings.py
│   ├── domain/
│   │   └── primitives.py
│   ├── models/
│   │   ├── employee.py
│   │   └── role.py
│   ├── repositories/
│   ├── schemas/
│   │   └── health_response.py
│   ├── services/
│   └── main.py
├── scripts/
│   └── check_forbidden_types.py
├── tests/
│   ├── test_domain_primitives.py
│   ├── test_employee_model.py
│   └── test_health_endpoint.py
├── .env.example
├── alembic.ini
└── pyproject.toml
```

## Getting Started

### Prerequisites

- Python 3.12 or higher
- pip

### Installation

From the repository root:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -e ".[dev]"
```

### Configuration

Copy the example environment file and configure as needed:

```bash
cp .env.example .env
```

Edit `.env` to set the `DATABASE_URL` and other variables. The default uses SQLite for development.

### Database Setup

Run the Alembic migration to create the database schema:

```bash
alembic upgrade head
```

### Running the Application

Start the FastAPI server:

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The API will be available at `http://127.0.0.1:8000`. Interactive documentation is available at `/docs` and the health endpoint responds at `/api/v1/health`.

## Configuration

| Variable | Purpose |
|----------|---------|
| APP_ENV | Application environment (dev, production) |
| DATABASE_URL | Database connection string (SQLite or PostgreSQL) |
| JWT_SECRET | Secret key for JWT token signing |
| JWT_ALGORITHM | Algorithm used for JWT tokens |
| ACCESS_TOKEN_EXPIRE_MINUTES | Token expiration time in minutes |
| CORS_ORIGINS | Allowed origins for cross-origin requests |

## Running the Checks

From the `backend/` directory:

```bash
ruff check .
mypy app
pytest
python scripts/check_forbidden_types.py
```

All checks must pass before committing changes.

## Roadmap

- [x] Project scaffolding and git setup
- [x] FastAPI app with settings and health endpoint
- [x] Backend quality tooling (ruff, mypy, pytest)
- [x] Database configuration with SQLAlchemy and Alembic
- [x] Domain primitives (enums, role policies, exceptions)
- [x] Role model
- [x] Polymorphic Employee model
- [x] Initial migration
- [ ] Repository pattern implementation
- [ ] Pydantic schemas for API requests/responses
- [ ] Seed script for roles and bootstrap admin
- [ ] Password hashing with argon2
- [ ] JWT token service
- [ ] Authentication service
- [ ] Authorization dependencies
- [ ] Auth routes (login, refresh, me)
- [ ] Employee service with business rules
- [ ] Employee CRUD endpoints
- [ ] Global error handling
- [ ] Postman collection and environment
- [ ] React Expo frontend scaffold
- [ ] Frontend structure and theme
- [ ] Typed API client
- [ ] Token storage abstraction
- [ ] Auth state and route guards
- [ ] Login screen
- [ ] Responsive app shell
- [ ] Employee directory dashboard
- [ ] Employee detail and admin actions
- [ ] Final documentation
