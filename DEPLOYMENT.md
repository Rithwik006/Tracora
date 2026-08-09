# 🚀 Tracora Deployment Guide & Walkthrough

This walkthrough details step-by-step how to deploy the **Tracora** application (FastAPI backend + Vite/React frontend).

---

## 🛠️ Prerequisites
- [Git](https://git-scm.com/) installed
- [Node.js 18+](https://nodejs.org/) and [Python 3.10+](https://www.python.org/)
- A free account on [Render](https://render.com/) (Backend) and [Vercel](https://vercel.com/) or [Netlify](https://netlify.com/) (Frontend)

---

## 🌐 Option 1: Render Cloud Deployment (Backend)

### How to Fix `ERROR: Could not open requirements file: No such file or directory: 'requirements.txt'`

Render attempted to build at the project root where it did not find `requirements.txt`. We have fixed this in two ways:

1. A `requirements.txt` has now been placed in both the **root folder** (`requirements.txt`) and `backend/requirements.txt`.
2. A `render.yaml` Blueprint file has been added for automatic Render configuration.

### Deployment Steps on Render:

#### Method A: Using Render Web Service Settings (Manual)
1. In your **Render Web Service Settings**:
   - **Root Directory**: `backend` (or leave blank since `requirements.txt` is now at root as well)
   - **Build Command**: 
     - If Root Directory is `backend`: `pip install -r requirements.txt`
     - If Root Directory is blank: `pip install -r requirements.txt`
   - **Start Command**: 
     - If Root Directory is `backend`: `uvicorn main:app --host 0.0.0.0 --port $PORT`
     - If Root Directory is blank: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
2. **Environment Variables**:
   - `SECRET_KEY`: Set a random secure 64-char string.
   - `ALLOWED_ORIGINS`: Set to your frontend URL (e.g. `https://your-app.vercel.app` or `*`).
3. Commit and push your git repo:
   ```bash
   git add .
   git commit -m "Add root requirements.txt and render.yaml for Render deployment"
   git push origin main
   ```
4. Click **Manual Deploy** -> **Deploy latest commit** on Render.

---

## 🌐 Option 2: Deploy Frontend on Vercel

1. Log in to [Vercel](https://vercel.com/) and click **Add New** -> **Project**.
2. Import your GitHub repository `Rithwik006/Tracora`.
3. Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Environment Variables:
   - `VITE_API_BASE_URL`: `https://your-backend-name.onrender.com`
5. Click **Deploy**.

---

## 🐳 Option 3: Docker Deployment

```bash
docker-compose up --build -d
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
