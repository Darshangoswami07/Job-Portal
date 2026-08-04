# 🚀 JobHub — AI-Powered Job Portal (MERN Stack)

![Frontend](https://img.shields.io/badge/Frontend-React-blue?logo=react)
![Backend](https://img.shields.io/badge/Backend-Node.js-green?logo=node.js)
![Database](https://img.shields.io/badge/Database-MongoDB-green?logo=mongodb)
![Auth](https://img.shields.io/badge/Auth-JWT%20%7C%20OAuth-orange?logo=jsonwebtokens)
![License](https://img.shields.io/badge/License-MIT-yellow)

A **full-stack, AI-powered career platform** built on the MERN stack. JobHub lets job seekers search and apply for jobs, build AI-optimized resumes and cover letters, practice mock interviews, explore salary data and career roadmaps, and manage a rich profile — while recruiters can post jobs, manage applicants, and run company pages, all from an admin dashboard.

---

## 🌐 Live Demo

🚀 **Frontend:** https://job-portal-kappa-nine.vercel.app
⚙️ **Backend API:** https://job-portal-backend-o9lb.onrender.com

---

## 📸 Screenshots

### 🏠 Home Page
<img width="100%" src="https://github.com/user-attachments/assets/3586949d-2e1e-4c0e-8392-f2d1bcac76a5" />

---

### 💼 Job Listings
<img width="100%" src="https://github.com/user-attachments/assets/b8469e51-b0b0-4f30-877e-e4eb1b03cb3c" />

---

### 🔐 Login / Register
<img width="100%" src="https://github.com/user-attachments/assets/bbeec10f-16c0-49f3-ba5d-9b61b724adfd" />

---

### 📊 Dashboard
<img width="100%" src="https://github.com/user-attachments/assets/4caac4b1-0f71-4ef7-9cb5-78088999f6bd" />

---

## ✨ Features

### 👨‍💼 Job Seekers
- 🔍 Search, filter, and browse jobs and companies
- 📄 Apply to jobs and track application status
- 💾 Save/bookmark jobs for later
- 🧑‍💻 Rich profile with education, experience, projects, skills, certifications, and social links
- 🔐 Secure authentication via email/password JWT or **Google / GitHub OAuth**
- 🔔 In-app notifications

### 🤖 AI Career Tools
- 📝 AI Resume Builder with downloadable templates (PDF/DOCX)
- ✅ AI Resume Checker with ATS scoring and improvement suggestions
- ✉️ AI Cover Letter Generator
- 🎤 AI Mock Interview practice with question banks and bookmarks
- 🗺️ Career Roadmap explorer
- 💰 Salary Explorer with market data
- 📚 Career Guides, Blogs, and a searchable Help Center

### 🧑‍💼 Recruiters & Companies
- 📝 Post, edit, and delete job listings
- 🏢 Company profile pages with AI-generated insights and job aggregation
- 👀 View and manage applicants per job
- 📋 Manage listings from a dedicated dashboard

### 🛠️ Admin Panel
- 📰 Manage blogs and career guides (create/edit)
- 💼 Manage jobs and companies
- ❓ Manage interview questions and resume templates
- 🎫 Handle support tickets and contact messages

---

## 🏗️ Tech Stack

### Frontend
- React (Vite)
- Redux Toolkit + Redux Persist
- Tailwind CSS + Radix UI
- Framer Motion (animations)
- TipTap (rich text editor)
- Recharts (data visualization)
- Axios, React Router
- jsPDF / html2canvas / docx / file-saver (resume & document export)

### Backend
- Node.js + Express.js
- MongoDB (Mongoose)
- JWT authentication + Passport (Google & GitHub OAuth)
- Zod validation
- Cloudinary (file/image uploads)
- pdf-parse & mammoth (resume parsing)
- node-cron (scheduled jobs)
- express-rate-limit (API protection)

---

## 📂 Project Structure

```
Job-Portal/
│
├── backend/
│   ├── config/           # DB, passport, cloudinary config
│   ├── controllers/       controllers_new/   # Route handlers (core + newer features)
│   ├── middlewares/       # Auth, error handling, rate limiting
│   ├── models/             models_new/       # Mongoose schemas (users, jobs, resumes, blogs, etc.)
│   ├── routes/              routes_new/      # API routes (core + AI/career features)
│   ├── services/          # AI service integrations
│   ├── validators/        # Zod request validation
│   ├── seed/               # Seed data (jobs, blogs, guides, questions)
│   └── index.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/    # admin, auth, company, job, profile, sections, shared, ui
│   │   ├── pages/          # Home, Jobs, Careers/*, Resources/*, Legal/*, About, Contact...
│   │   ├── redux/ store/  # State management
│   │   ├── routes/        # App routing
│   │   └── services/      # API service layer
│   └── index.html
│
└── README.md
```

---

## ⚙️ Environment Variables

### Backend (`.env`)
```
PORT=5000
MONGO_URI=your_mongodb_connection
SECRET_KEY=your_secret_key
FRONTEND_URL=http://localhost:5173

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 🛠️ Installation & Setup

### 1️⃣ Clone Repository
```bash
git clone https://github.com/Darshangoswami07/Job-Portal.git
cd Job-Portal
```

### 2️⃣ Backend Setup
```bash
cd backend
npm install
npm run dev
```

### 3️⃣ Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🚀 Deployment

### Backend (Render)
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

### Frontend (Vercel)
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

---

## 🔐 Authentication
- JWT-based authentication with HTTP-only cookies
- Google & GitHub OAuth via Passport.js
- Protected routes with middleware
- Secure password hashing (bcrypt)

---

## 📡 Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/user/register` | Register user |
| POST | `/api/v1/user/login` | Login user |
| GET | `/api/v1/oauth/google` | Google OAuth login |
| GET | `/api/v1/oauth/github` | GitHub OAuth login |
| GET | `/api/v1/job` | Get all jobs |
| POST | `/api/v1/job` | Create job |
| GET | `/api/v1/job/:id` | Get job by ID |
| DELETE | `/api/v1/job/:id` | Delete job |
| GET | `/api/v1/company` | Get companies |
| POST | `/api/v1/resume-check` | AI resume analysis |
| POST | `/api/v1/cover-letter` | AI cover letter generation |
| GET | `/api/v1/blog` | Get blogs |
| GET | `/api/v1/career-guide` | Get career guides |
| GET | `/api/v1/salary` | Get salary data |
| GET | `/api/v1/roadmap` | Get career roadmaps |

---

## 💡 Key Highlights
- 🧱 Clean, modular architecture (core + newer feature modules)
- 🤖 AI-powered resume, cover letter, and interview prep tools
- ⚡ Fast frontend with Vite
- 📱 Fully responsive, animated UI (Framer Motion)
- 🔄 RESTful API design with Zod validation
- 🔐 JWT + OAuth authentication
- ☁️ Deployment-ready structure

---

## 🧑‍💻 Author

**Darshan Goswami**
Software Engineer • Full Stack Developer • AI/ML Engineer

- 💼 LinkedIn: https://www.linkedin.com/in/darshan-goswami-b09137222/
- 🐙 GitHub: https://github.com/Darshangoswami07
- 🌐 Portfolio: https://silver-bienenstitch-7d8c59.netlify.app

---

## 🤝 Contribution

Contributions are welcome!
Feel free to fork this repo and submit a PR.

## ⭐ Show Your Support

If you like this project, give it a ⭐ on GitHub!
