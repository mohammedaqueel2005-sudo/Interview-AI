# 🚀 Interview-AI

An AI-powered Interview Preparation Platform that analyzes a candidate's resume, job description, and self-description to generate a comprehensive interview report. The platform provides personalized interview questions, skill gap analysis, preparation plans, and downloadable PDF reports to help candidates prepare effectively for technical interviews.

---

## ✨ Features

- 📄 Resume Upload (PDF)
- 💼 Job Description Analysis
- 👤 Self Description Input
- 🤖 AI-Generated Interview Report
- 📊 Resume & Job Match Score
- 💡 Technical and Behavioral Interview Questions
- ⚠️ Skill Gap Identification
- 📅 Personalized Preparation Plan
- 📥 Download Interview Report as PDF
- 🔐 User Authentication (JWT & Cookies)

# 🛠️ Tech Stack

## Frontend

- React.js
- React Router
- SCSS
- Axios
- Lucide React

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Multer

## AI

- Google Gemini API
- Zod (Structured JSON Response)

## Other Tools

- Puppeteer
- HTML-PDF
- Cookie Parser
- dotenv

---

# 📂 Project Structure

```
Interview-AI
│
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── hooks
│   │   ├── pages
│   │   ├── services
│   │   ├── styles
│   │   └── context
│   └── package.json
│
├── backend
│   ├── controllers
│   ├── models
│   ├── routes
│   ├── middleware
│   ├── services
│   ├── utils
│   ├── uploads
│   └── package.json
│
└── README.md
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/mohammedaqueel2005-sudo/Interview-AI.git

cd Interview-AI
```

---

## Backend Setup

```bash
cd backend

npm install

npm run dev
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

# 🔑 Environment Variables

Create a `.env` file inside the backend folder.

```env
PORT=3000

MONGODB_URI=your_mongodb_connection

JWT_SECRET=your_secret_key

GOOGLE_API_KEY=your_gemini_api_key

CLIENT_URL=http://localhost:5173
```

---

# 🚀 How It Works

1. Register/Login.
2. Upload your Resume (PDF).
3. Paste the Job Description.
4. Enter your Self Description.
5. Click **Generate Interview Report**.
6. AI analyzes:
   - Resume
   - Job Description
   - Self Description
7. View:
   - Match Score
   - Strengths
   - Skill Gaps
   - Technical Questions
   - Behavioral Questions
   - Preparation Plan
8. Download the report as a PDF.

---

# 📊 AI Generated Report Includes

- Resume Match Score
- Candidate Summary
- Strengths
- Weaknesses
- Skill Gap Analysis
- Technical Questions
- Behavioral Questions
- Personalized Preparation Roadmap
- Final Recommendation

---

# 🔒 Authentication

- JWT Authentication
- HTTP Only Cookies
- Protected Routes
- Secure Login & Registration

---

# 📄 API Endpoints

## Authentication

```
POST /api/auth/register

POST /api/auth/login

GET /api/auth/me

POST /api/auth/logout
```

## Interview

```
POST /api/interview/generate

GET /api/interview

GET /api/interview/:id

GET /api/interview/:id/pdf
```

---

# 🎯 Future Improvements

- Voice Mock Interviews
- AI Follow-up Questions
- Live Coding Interview
- ATS Resume Checker
- Company-wise Interview Preparation
- Interview History Dashboard
- Email Interview Reports
- Multi-language Support

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository

2. Create a feature branch

```bash
git checkout -b feature-name
```

3. Commit your changes

```bash
git commit -m "Added new feature"
```

4. Push to your branch

```bash
git push origin feature-name
```

5. Open a Pull Request

---

# 👨‍💻 Author

**Mohammed Aqueel**

GitHub:
https://github.com/mohammedaqueel2005-sudo

LinkedIn:
https://linkedin.com/in/mohammedaqueel

---

# ⭐ Support

If you found this project helpful, consider giving it a ⭐ on GitHub!

---

## 📜 License

This project is licensed under the MIT License.
