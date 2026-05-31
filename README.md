# Eventify 🕸️

### *The Campus Event Operating System & Opportunity Graph*

Eventify is a full-stack campus event management and passive networking hub that transforms scattered college communication into a gamified, data-driven student ecosystem.

---

## 🚀 Key Features

1. **Smart Discovery (Feed & Explore)**: Combines local college events and external hackathons (GDG, Devfolio, Unstop) into a unified feed with mood-based filters and personalized recommendation algorithms.
2. **Live Quiz Arena**: Dynamic event interaction allowing organizers to push live quizzes. Students answer in real-time, earning experience points (XP).
3. **Campus Opportunity Graph**: A passive mapping engine that scans RSVP logs and certificate verifications to connect students based on path overlaps, search for peer mentors, and align them with student clubs.
4. **Certificate Vault (MAR Integration)**: Direct upload pipeline for external certificates. Organizers approve credentials to automatically calculate and unlock MAR (Mandatory Additional Requirements) points and profile badges.
5. **Secure Event Operations**: Digital meal coupon claiming (linked to physical check-in checks), live crowd occupancy heatmaps, and real-time support ticket routing.
6. **CampusBot Chatbot**: An AI chatbot powered by the **Google Gemini API** that processes current event databases to answer student scheduling and location questions instantly.

---

## 🛠️ Tech Stack

* **Frontend**: React.js (Vite) + TailwindCSS + Custom CSS animations.
* **Backend**: FastAPI (Python) + Uvicorn server.
* **Database**: MongoDB Atlas (NoSQL) with optimized indices for relationships and lookups.
* **AI Integration**: Google Gemini API for NLP chatbot answers.
* **Authentication**: bcrypt password hashing and LocalStorage-based session storage.

---

## 📂 Project Structure

```
Eventify/
├── backend/                  # Python API Service
│   ├── main.py               # Main Entry Point & Routes
│   ├── database.py           # MongoDB Configurations
│   ├── graph.py              # Path Overlap & Mentor Algorithms
│   ├── chatbot.py            # Gemini AI Client
│   └── requirements.txt      # Backend Dependencies
│
└── frontend/                 # React Single Page App
    ├── public/               # Static Logo and Theme Assets
    ├── src/
    │   ├── components/       # Shared Components (Navbar, EventCard)
    │   ├── pages/            # View Pages (OpportunityGraph, Feed, etc.)
    │   └── config.js         # API Server Address Config
```

---

## ⚙️ Quick Start Setup

### 1. Backend Service Setup
1. Navigate to the `backend` directory.
2. Create a `.env` file containing:
   ```env
   MONGO_URL="your-mongodb-connection-string"
   GEMINI_API_KEY="your-google-gemini-api-key"
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Seed initial campus fests:
   ```bash
   python seed.py
   ```
5. Spin up the API server:
   ```bash
   uvicorn main:app --reload
   ```

### 2. Frontend SPA Setup
1. Navigate to the `frontend` directory.
2. Install npm packages:
   ```bash
   npm install
   ```
3. Set your backend connection in `src/config.js` or via environment variables:
   ```javascript
   const API = "http://localhost:8000"; // No trailing slash
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🔗 Deployment

- **Backend**: Deployed as a Web Service on Render (`uvicorn main:app --host 0.0.0.0 --port $PORT`).
- **Frontend**: Deployed as a Static Site on Render (build command: `npm run build`, publish folder: `dist`). SPA redirect rewrite rule configured: `/* -> /index.html`.
