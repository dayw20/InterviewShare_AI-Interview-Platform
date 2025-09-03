# InterviewShare AI Interview Platform

An intelligent platform that connects job seekers and professionals through AI-powered mock interviews, experience sharing, and secure coding practice. Built with Django, React, and modern AI technologies.

![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-blue)
![Backend](https://img.shields.io/badge/Backend-Django%20%2B%20DRF-green)

## 🚀 Platform Overview

Interviewshare is a comprehensive platform that connects job seekers and professionals through shared interview experiences. It features an AI-powered mock interview system and a secure code execution sandbox for technical practice.

### ✨ Key Features

- **AI Mock Interviews**: Practice with intelligent interview simulations
- **Code Execution Sandbox**: Safe environment for coding practice
- **Experience Sharing**: Create and share interview experiences
- **Secure Authentication**: Email/password and Google OAuth support
- **Interactive Community**: Like, comment, and engage with posts
- **Smart Filtering**: Search by company, post type, and more
- **User Profiles**: Comprehensive statistics and achievements
- **Responsive Design**: Works seamlessly on all devices

## 🏗️ Architecture

```
interviewshare/
├── backend/              # Django REST Framework API
│   ├── posts_app/        # Interview posts management
│   ├── users_app/        # User authentication & profiles
│   ├── ai_interview/     # AI mock interview logic
│   └── code_sandbox/     # Code execution system
├── frontend/             # React TypeScript UI
│   ├── components/       # Reusable React components
│   ├── context/          # State management
│   ├── lib/              # Utility functions
│   └── types/            # TypeScript definitions
└── docker/               # Containerized services
    └── code-sandbox/     # Secure code execution
```

## 🛠️ Technology Stack

### Frontend
- **React 18+** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React OAuth** - Google authentication integration

### Backend
- **Django 4+** - Web framework
- **Django REST Framework** - API development
- **Python 3.8+** - Core programming language
- **SQLite/PostgreSQL** - Database options
- **JWT Authentication** - Secure token-based auth

### DevOps & Tools
- **Docker** - Containerization
- **Git** - Version control
- **ESLint** - Code quality
- **Prettier** - Code formatting

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** and **npm** for frontend
- **Python 3.8+** and **pip** for backend
- **Docker** and **Docker Compose** for code sandbox
- **Git** for version control

### 1. Clone the Repository

```bash
git clone https://github.com/dayw20/Interviewshare_AI-Interview-Platform.git
cd Interviewshare_AI-Interview-Platform
```

### 2. Backend Setup

#### Create Virtual Environment
```bash
# Create virtual environment
python -m venv venv

# Activate (macOS/Linux)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate
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

# Create superuser (optional)
python manage.py createsuperuser
```

#### Start Django Server
```bash
python manage.py runserver
```

Backend will be available at `http://127.0.0.1:8000/`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:5173/`

### 4. Code Execution Sandbox

```bash
cd docker/code-sandbox
docker build -t code-sandbox .
```

- `POST /api/code-verification/` - Execute and verify code
- `GET /api/problems/` - List coding problems
- `POST /api/ai-interview/` - Start AI mock interview

## ⚙️ Environment Configuration

### Frontend Environment
Create `.env` file in `frontend/` directory:
```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>
```

### Backend Environment
Create `.env` file in `backend/` directory:
```env
SECRET_KEY=<your-django-secret-key>
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
GOOGLE_OAUTH_CLIENT_ID=<your-google-client-id>
GOOGLE_OAUTH_CLIENT_SECRET=<your-google-client-secret>
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:coverage  # Run with coverage report
npm run test:ui        # Run with UI interface
```

### Continuous Integration
This project uses GitHub Actions for automated testing:
- **Backend**: Python tests, linting with flake8
- **Frontend**: React tests, linting with ESLint, build verification

Tests run automatically on every push and pull request.

