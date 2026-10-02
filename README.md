# Deal Desk Quote Simulator

A small full-stack take-home project.

- **frontend/** — Next.js + TypeScript (App Router) UI
- **backend/** — Python FastAPI service (HTTP API)

The two apps run separately and communicate over HTTP.

## Getting started

### Backend
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Health check: http://localhost:8000/health

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App: http://localhost:3000
