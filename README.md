# Interview Experience Sharing Platform

A full-stack web application for sharing interview experiences, built with:
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Django, Django REST Framework
- **Additional**: Docker (for code execution sandbox)

## Features

- User authentication (email/password and Google OAuth)
- Create and share interview experiences
- Like, comment, and view post details
- Filter and search posts by company, post type, etc.
- User profiles with statistics
- AI Mock Interview practice environment
- Code execution sandbox for coding problems

## Prerequisites

- Node.js (v18+)
- Python (v3.8+)
- Docker and Docker Compose
- Git

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd interviewshare
```

### 2. Backend Setup

#### Create a Virtual Environment

```bash
# Create a virtual environment
python -m venv venv

# Activate it
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate
```

#### Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

#### Database Setup

```bash
# Run migrations
python manage.py migrate

# Create a superuser (optional)
python manage.py createsuperuser
```

#### Start the Django Server

```bash
python manage.py runserver
```

The backend will be available at http://127.0.0.1:8000/

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:5173/

### 4. Code Execution Sandbox Setup

Build the Docker image for the code execution sandbox:

```bash
cd code-sandbox
docker build -t code-sandbox .
```

## Project Structure

```
interview-experience-platform/
├── backend/                  # Django backend
│   ├── posts_app/            # Main application
│   │   ├── models.py         # Database models
│   │   ├── serializers.py    # API serializers
│   │   ├── views.py          # API endpoints
│   │   └── urls.py           # URL routing
│   └── ...
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── context/          # Context providers
│   │   ├── lib/              # Utility functions
│   │   ├── types/            # TypeScript types
│   │   ├── App.tsx           # Main App component
│   │   └── main.tsx          # Entry point
│   └── ...
└── code-sandbox/             # Docker container for code execution
    └── run_user_code.py      # Python script for code execution
```

## API Endpoints

- **Authentication**:
  - `/auth/login/` - Login
  - `/auth/registration/` - Register
  - `/auth/google/` - Google OAuth login

- **Posts**:
  - `/api/posts/` - List/Create posts
  - `/api/posts/<id>/` - Retrieve/Update/Delete post
  - `/api/posts/<id>/like/` - Like/Unlike post
  - `/api/posts/<id>/add_comment/` - Add comment to post
  - `/api/posts/trending/` - Get trending posts

- **Users**:
  - `/api/users/<id>/` - User profile
  - `/api/users/me/` - Current user profile
  - `/api/users/<id>/follow/` - Follow/Unfollow user

- **Code Execution**:
  - `/api/code-verification/` - Execute and verify user code
  - `/api/problems/` - List coding problems

## Environment Variables

### Frontend
Create a `.env` file in the frontend directory with:

```
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>
```

### Backend
Create a `.env` file in the backend directory with:

```
SECRET_KEY=<your-django-secret-key>
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
```

## Development Workflow

1. Start the backend server
2. Start the frontend development server
3. Make sure the Docker daemon is running for code execution
