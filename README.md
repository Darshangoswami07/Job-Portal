# 🚀 Job Portal (MERN Stack)

![Frontend](https://img.shields.io/badge/Frontend-React-blue?logo=react)
![Backend](https://img.shields.io/badge/Backend-Node.js-green?logo=node.js)
![Database](https://img.shields.io/badge/Database-MongoDB-green?logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-yellow)

A **full-stack Job Portal application** built using the MERN stack. This platform enables users to search and apply for jobs, while recruiters can post and manage job listings efficiently.

---

## 🌐 Live Demo

🚀 **Frontend:** https://your-frontend-url.vercel.app
⚙️ **Backend API:** https://your-backend-url.onrender.com

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

### 👨‍💼 User

* 🔍 Search and filter jobs
* 📄 Apply to jobs
* 💾 Save/bookmark jobs
* 📊 Track applications
* 🔐 Secure authentication

### 🧑‍💻 Recruiter

* 📝 Post new jobs
* ✏️ Edit/Delete jobs
* 👀 View applicants
* 📋 Manage listings

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
* Protected routes with middleware
* Secure password handling

---

## 📡 API Endpoints

| Method | Endpoint           | Description   |
| ------ | ------------------ | ------------- |
| POST   | /api/auth/register | Register user |
| POST   | /api/auth/login    | Login user    |
| GET    | /api/jobs          | Get all jobs  |
| POST   | /api/jobs          | Create job    |
| GET    | /api/jobs/:id      | Get job       |
| DELETE | /api/jobs/:id      | Delete job    |

---

## 💡 Key Highlights

* 🧱 Clean MVC architecture
* ⚡ Fast frontend with Vite
* 📱 Fully responsive UI
* 🔄 RESTful API design
* ☁️ Deployment-ready structure

---

## 🧑‍💻 Author

**Darshan Goswami**
MERN Stack Developer

📧 Email: [goswamidarshan12345@gmail.com](mailto:goswamidarshan12345@gmail.com)
🌐 Portfolio: https://silver-bienenstitch-7d8c59.netlify.app

---

## 🤝 Contribution

Contributions are welcome!
Feel free to fork this repo and submit a PR.

---

## ⭐ Show Your Support

If you like this project, give it a ⭐ on GitHub!

---
