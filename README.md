# Lumio Monorepo

A modern, high-performance monorepo boilerplate with **FastAPI** and **React**.

## Structure

- `/backend`: FastAPI application with CORS enabled.
- `/frontend`: React application built with Vite and TypeScript.

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 16+
- `pip` and `npm`

### Installation

```bash
make install
```

### Running the Application

It is recommended to run the backend and frontend in separate terminals:

**Terminal 1 (Backend):**
```bash
uvicorn main:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```
docker compose up -d
The API will be available at `http://localhost:8000` and the frontend at `http://localhost:5173`.

## Features

- **FastAPI**: Type safety, automatic docs (Swagger), and async performance.
- **Vite + React**: Lightning fast HMR and optimized builds.
- **Modern UI**: Glassmorphism, responsive design, and Inter/Outfit typography.
- **CORS Configured**: Ready for local development out of the box.
