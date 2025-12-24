# Inclufy Marketing

AI-powered marketing automation platform built with React + TypeScript + FastAPI + Supabase.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite 7, Tailwind CSS, shadcn/ui
- **Backend**: Python FastAPI, Supabase (PostgreSQL), OpenAI
- **Auth**: Supabase Auth (email/password, Google OAuth, GitHub OAuth)

## Getting Started

```sh
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in your Supabase and API keys in .env

# Start development server
npm run dev

# Start backend (in separate terminal)
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Project Structure

- `src/` - React frontend
- `backend/` - FastAPI backend
- `supabase/` - Database migrations
