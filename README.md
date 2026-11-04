# ⚡ Tracora

> **A modern, elegant, and high-performance task management application designed for focus, speed, and seamless productivity.**

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

---

## 🌟 Overview

**Tracora** is a full-stack task and productivity management platform built with modern web technologies. Combining a high-performance **FastAPI** backend with a responsive, animated **React 19 + TypeScript** frontend, Tracora empowers individuals and teams to organize tasks, track deadlines, filter priorities, and stay on top of daily goals with an intuitive and visually captivating interface.

---

## ✨ Features

- 🔐 **Secure Authentication**: Robust user registration and login powered by OAuth2 Password Bearer flow, JWT tokens, and salted bcrypt password hashing.
- 📋 **Comprehensive Task Management**:
  - Full CRUD operations (Create, Read, Update, Delete) for tasks.
  - Granular priority management (`Low`, `Medium`, `High`) with distinct visual indicators.
  - Due date tracking with smart relative time formatting, countdowns, and overdue alerts.
  - Instant status toggling (`Active` / `Completed`) and batch clear for completed tasks.
- 🔍 **Real-time Search & Filtering**:
  - Instant live keyword search across task titles and descriptions.
  - Multi-criteria filtering by status (`All`, `Active`, `Completed`, `Overdue`) and priority (`All`, `High`, `Medium`, `Low`).
  - Dynamic sorting by creation date, due date, or priority.
- 🎨 **Modern Interactive UI/UX**:
  - Fluid micro-animations with **Framer Motion** and signature SVG path animations with **GSAP**.
  - Custom dynamic cursor and dark aesthetic styled with **Tailwind CSS**.
  - Responsive modal dialogs for frictionless task creation and editing.
- 🛡️ **Production-Ready Backend**:
  - Auto-generated interactive OpenAPI/Swagger documentation (`/docs`) and ReDoc (`/redoc`).
  - Dual database support: SQLite for rapid local development and PostgreSQL for production deployments.
  - Comprehensive automated test suite with **Pytest**.
- 🐳 **Containerized & Cloud Ready**:
  - Ready-to-run **Docker & Docker Compose** multi-container setup with Nginx reverse proxy.
  - Cloud-ready configuration files for **Render** (`render.yaml`) and **Vercel** (`vercel.json`).

---

## 🏗️ Tech Stack

### Frontend
- **Framework:** React 19 (TypeScript)
- **Bundler:** Vite
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion, GSAP
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **Routing:** React Router v7

### Backend
- **Framework:** FastAPI
- **Server:** Uvicorn (ASGI)
- **ORM:** SQLAlchemy 2.x
- **Validation:** Pydantic v2
- **Auth & Security:** python-jose (JWT), Passlib (Bcrypt)
- **Database:** SQLite (local) / PostgreSQL (production via psycopg2-binary)
- **Testing:** Pytest, Starlette TestClient

### DevOps & Deployment
- **Containerization:** Docker, Docker Compose
- **Web Server / Reverse Proxy:** Nginx (frontend container)
- **Cloud Hosting:** Vercel (Frontend), Render (Backend)

---

## 📁 Project Structure

```text
Tracora/
├── backend/
│   ├── alembic/              # Database migration scripts
│   ├── core/                 # App configurations and security settings
│   ├── routers/              # API endpoints (auth, tasks)
│   ├── tests/                # Automated pytest test suite
│   ├── crud.py               # Database query operations
│   ├── database.py           # SQLAlchemy engine & session setup
│   ├── Dockerfile            # Backend container definition
│   ├── main.py               # FastAPI application entrypoint
│   ├── models.py             # SQLAlchemy ORM models
│   ├── requirements.txt      # Python dependencies
│   └── schemas.py            # Pydantic schemas for request/response
├── frontend/
│   ├── public/               # Static assets & icons
│   ├── src/
│   │   ├── api/              # Axios API client handlers
│   │   ├── components/       # Reusable components & modals
│   │   ├── pages/            # View pages (Landing, Login, Dashboard)
│   │   ├── App.tsx           # Application route definitions
│   │   └── main.tsx          # Frontend bootstrapping
│   ├── Dockerfile            # Multi-stage production container build
│   ├── nginx.conf            # Nginx server configuration
│   ├── package.json          # Frontend dependencies & scripts
│   └── vite.config.ts        # Vite configuration
├── docker-compose.yml        # Docker orchestration file
├── DEPLOYMENT.md             # Step-by-step cloud deployment walkthrough
├── render.yaml               # Render Blueprint configuration
├── requirements.txt          # Root requirements for cloud buildpacks
├── vercel.json               # Vercel deployment routing configuration
└── README.md                 # Project documentation
```

---

## 🚀 Getting Started

### 📋 Prerequisites

Make sure you have installed:
- [Git](https://git-scm.com/)
- [Python 3.10+](https://www.python.org/)
- [Node.js 18+](https://nodejs.org/) & `npm`
- *(Optional)* [Docker & Docker Compose](https://www.docker.com/)

---

### 💻 Local Development Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/Rithwik006/Tracora.git
cd Tracora
```

#### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create a virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Set environment variables in .env
# Copy example if needed:
# cp .env.example .env

# Run FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at **`http://localhost:8000`**.  
Interactive API Docs: **`http://localhost:8000/docs`**

#### 3. Frontend Setup

In a new terminal window:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

The frontend app will be running at **`http://localhost:5173`**.

---

### 🐳 Running with Docker Compose

To spin up both frontend and backend in isolated containers:

```bash
docker-compose up --build
```

- **Frontend App:** `http://localhost:5173`
- **Backend API:** `http://localhost:8000`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`

To stop the containers:
```bash
docker-compose down
```

---

## 🧪 Running Tests

The test suite validates authentication, token handling, task CRUD lifecycle, and permission boundaries using Pytest:

```bash
# Activate virtual environment and run tests
cd backend
pytest -v
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env` or Render Dashboard)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `SECRET_KEY` | Secret key for JWT token generation | Default hardcoded string *(change in production)* |
| `ALGORITHM` | Cryptographic algorithm for JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT expiration duration in minutes | `30` |
| `DATABASE_URL` / `SQLALCHEMY_DATABASE_URI` | Database connection URL | `sqlite:///./tasktact.db` |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | `http://localhost:5173,http://localhost:3000` |

### Frontend (`frontend/.env` or Vercel Dashboard)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL pointing to the FastAPI backend API | `http://localhost:8000` |

---

## 🌐 Deployment

For complete, detailed instructions on deploying Tracora to production using **Render** (Backend) and **Vercel** (Frontend), refer to the [Deployment Guide](DEPLOYMENT.md).

- **Backend (Render):** Uses `render.yaml` or standard Web Service configuration.
- **Frontend (Vercel):** Pre-configured with `vercel.json` for seamless client-side single page routing.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
