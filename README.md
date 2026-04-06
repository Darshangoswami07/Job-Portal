# 🚀 Job Portal (MERN Stack)

A full-stack Job Portal web application that allows users to explore job opportunities, apply for jobs, and manage applications. Recruiters can post jobs, manage listings, and track applicants.

---

## 📌 Features

### 👨‍💼 User Features

* Browse and search jobs dynamically
* Apply for jobs
* Save/bookmark jobs
* View applied jobs history
* User authentication (Login/Register)

### 🧑‍💻 Recruiter Features

* Post new jobs
* Manage job listings
* View applicants
* Update or delete job posts

---

## 🏗️ Tech Stack

### Frontend

* React (Vite)
* Tailwind CSS
* Axios
* React Router

### Backend

* Node.js
* Express.js
* MongoDB (Mongoose)
* JWT Authentication

---

## 📂 Project Structure

```
Job-Portal/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── index.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   └── index.html
│
└── README.md
```

---

## ⚙️ Environment Variables

### Backend (.env)

```
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:5173
```

---

## 🛠️ Installation & Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/job-portal.git
cd job-portal
```

---

### 2️⃣ Backend Setup

```bash
cd backend
npm install
npm run dev
```

---

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🚀 Deployment

### Backend (Render)

* Root Directory: `backend`
* Build Command: `npm install`
* Start Command: `npm start`

### Frontend (Vercel)

* Root Directory: `frontend`
* Build Command: `npm run build`
* Output Directory: `dist`

---

## 🔐 Authentication

* JWT-based authentication
* Secure password hashing
* Protected routes using middleware

---

## 📡 API Overview

| Method | Endpoint           | Description   |
| ------ | ------------------ | ------------- |
| POST   | /api/auth/register | Register user |
| POST   | /api/auth/login    | Login user    |
| GET    | /api/jobs          | Get all jobs  |
| POST   | /api/jobs          | Create job    |
| GET    | /api/jobs/:id      | Get job by ID |
| DELETE | /api/jobs/:id      | Delete job    |

---

## 💡 Key Highlights

* Clean folder structure (MVC architecture)
* Scalable backend design
* Responsive UI with Tailwind
* RESTful API design
* Ready for production deployment

---

## 🧑‍💻 Author

**Darshan Goswami**
Frontend Developer | MERN Stack Developer

📧 Email: [goswamidarshan12345@gmail.com](mailto:goswamidarshan12345@gmail.com)
🌐 Portfolio: https://silver-bienenstitch-7d8c59.netlify.app

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!

---
