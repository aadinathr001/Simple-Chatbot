# ⚡ Simple Chatbot Portfolio Project

A production-grade, link-shareable AI chatbot web application powered by `openai/gpt-oss-20b` via Groq's low-latency inference engine, with a secured backend proxy (FastAPI / Python with `venv`), rate limiting, and a modern responsive dark-mode frontend.

---

## 🚀 Live Demo
> **[Click here to open the Live Demo](https://your-chatbot-name.onrender.com)** 

---

## 🏗️ Architecture

```
[Browser Client: Vanilla JS / CSS]
               │
               ▼  (HTTP POST /api/chat - rate-limited & sanitized)
[Backend API Proxy (FastAPI / Uvicorn)]
               │  (Injects secret process.env / os.getenv GROQ_API_KEY)
               ▼
[Groq Cloud API: openai/gpt-oss-20b]
```

### 🔒 Key Security & Architectural Principles
- **No Client Token Leakage:** The Groq API key is stored strictly on the server in environment variables (`GROQ_API_KEY`), never exposed to browser bundles or client network traces.
- **Abuse Prevention:** IP-based rate limiting via `slowapi` prevents accidental quota exhaustion on public links.
- **Input Guardrails:** Server-enforced 500-character input capping and schema sanitation using Pydantic.
- **Multi-turn Context Memory:** In-memory conversation state preserves dialog context across turns while maintaining a strict token budget.
- **Resilient Cold Starts:** Integrated client notice gracefully alerts recruiters when Render's free tier spins up from idle sleep (~30–50s).

---

## 🧰 Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | HTML5, Modern CSS, Vanilla JavaScript | Zero-build fast load, mobile-responsive, dark-mode design system |
| **Backend** | Python 3, FastAPI, Uvicorn | High-performance asynchronous API proxy, Pydantic data validation |
| **LLM Inference** | Groq Cloud (`openai/gpt-oss-20b`) | Ultra-fast token generation, free-tier hosting for open-weights model |
| **Rate Limiter** | SlowAPI | IP-based request throttling (30 req / 15 min) |
| **Testing** | Pytest, FastAPI TestClient | Automated integration test coverage for endpoints and error handling |
| **Hosting** | Render.com (Web Service, Free Tier) | Automated continuous deployment from GitHub with free SSL/HTTPS |

---

## 📁 Project Structure

```
├── requirements.txt     # Python dependencies (FastAPI, Groq, Uvicorn, SlowAPI, Pytest)
├── main.py              # FastAPI server, proxy logic, rate limiting & static mounting
├── .env.example         # Template for environment variables
├── .gitignore           # Keeps venv, .env, and caches out of git
├── test_main.py         # Automated test suite (Pytest)
├── public/              # Client-side static assets
│   ├── index.html       # Semantic HTML5 layout and architecture modal
│   ├── style.css        # Responsive dark-theme styling
│   └── script.js        # Client state, event handling & API calls
├── venv/                # Python virtual environment (gitignored)
└── README.md            # Project documentation and recruiter showcase
```

---

## 🛠️ Local Development Setup

### 1. Activate the Virtual Environment
On Windows (PowerShell):
```powershell
.\venv\Scripts\Activate.ps1
```
*(Or on macOS/Linux: `source venv/bin/activate`)*

### 2. Configure Your Groq API Key
Copy `.env.example` to `.env`:
```powershell
cp .env.example .env
```
Open `.env` in your editor and enter your Groq API key:
```env
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-20b
PORT=8000
```

### 3. Run Automated Tests
```powershell
.\venv\Scripts\pytest.exe -v
```
All tests verify endpoint availability, input validation, rate limiting, and error states.

### 4. Start the Application Server
```powershell
.\venv\Scripts\python.exe main.py
```
Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser to start chatting with `openai/gpt-oss-20b`. Check the API health at [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health).

---

## 🚢 Deploying to Render (Free Tier)

1. **Initialize Git & Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: GPT-OSS-20B portfolio chatbot"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. **Create Web Service on Render**:
   - Log into [Render.com](https://render.com).
   - Click **New +** > **Web Service**.
   - Connect your GitHub repository.
3. **Configure Settings**:
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** `Free`
4. **Add Environment Variables in Render Dashboard**:
   - Key: `GROQ_API_KEY`, Value: `gsk_your_groq_api_key`
   - Key: `GROQ_MODEL`, Value: `openai/gpt-oss-20b`
5. **Deploy & Share**:
   - Render will build and deploy your app, providing a live HTTPS link (e.g. `https://your-chatbot.onrender.com`).
   - Add this link directly to your resume and portfolio!

> **Note on Free-Tier Sleeping:** Render free tier instances automatically sleep after 15 minutes of inactivity. When a recruiter opens your link after it has slept, the initial request takes approximately 30–50 seconds to wake the container. The web app contains a friendly indicator to inform the user while the server starts up.

---

## 📄 License
MIT License. Free to use and customize for your own portfolio.
