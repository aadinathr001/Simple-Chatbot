
```markdown
# ⚡ Simple Chatbot

A link-shareable AI chatbot powered by `openai/gpt-oss-20b` via Groq's low-latency inference API, with a secure FastAPI backend proxy, rate limiting, and a responsive dark-mode frontend.

**[Live Demo →](https://simple-chatbot-kkxd.onrender.com/)**

---

## Architecture

```
Browser (HTML/CSS/JS)
      │  POST /api/chat
      ▼
FastAPI Backend (rate-limited, sanitized)
      │  server-side GROQ_API_KEY
      ▼
Groq Cloud API (openai/gpt-oss-20b)
```

**Key design principles**
- **No key leakage** — `GROQ_API_KEY` lives only in server env vars, never sent to the client.
- **Abuse prevention** — IP-based rate limiting via `slowapi` (30 req / 15 min).
- **Input validation** — 500-char cap + Pydantic schema enforcement.
- **Context memory** — in-memory multi-turn conversation state with a bounded token budget.
- **Cold start handling** — UI notice for Render free-tier wake-up delay (~30–50s).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS, Vanilla JS |
| Backend | Python 3, FastAPI, Uvicorn |
| LLM | Groq Cloud (`openai/gpt-oss-20b`) |
| Rate Limiting | SlowAPI |
| Testing | Pytest, FastAPI TestClient |
| Hosting | Render.com (free tier, auto-deploy from GitHub) |

---

## Project Structure

```
├── main.py              # FastAPI app, proxy logic, rate limiting
├── test_main.py          # Pytest test suite
├── requirements.txt      # Dependencies
├── .env.example           # Env var template
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
└── README.md
```

---

## Local Setup

**1. Create & activate a virtual environment**
```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
```

**2. Install dependencies**
```bash
pip install -r requirements.txt
```

**3. Configure environment variables**
```bash
cp .env.example .env
```
```env
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-20b
PORT=8000
```

**4. Run tests**
```bash
pytest -v
```

**5. Start the server**
```bash
python main.py
```
Visit `http://127.0.0.1:8000` (health check at `/api/health`).

---

## Deploying to Render

1. Push the repo to GitHub.
2. On [Render.com](https://render.com): **New → Web Service** → connect your repo.
3. Configure:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free
4. Add environment variables: `GROQ_API_KEY`, `GROQ_MODEL`
5. Deploy — Render provides a live HTTPS URL.

> ⚠️ Render's free tier sleeps after 15 minutes of inactivity; the first request afterward may take 30–50s to wake up. The UI shows a loading notice during this delay.

---

## License

MIT
```

**What I removed/changed:**
- Cut the redundant "Rationale" column in the tech stack table (was mostly restating the column name)
- Merged the verbose security bullet points into shorter, punchier statements
- Removed the `venv/` and `.gitignore` lines from the folder tree (implementation detail, not structural)
- Simplified Windows-specific PowerShell commands to standard cross-platform syntax with an inline Windows note
- Cut the "Add this to your resume!" recruiter-pitch language — the live demo link at the top already does that job
- Shortened the deployment steps into a tighter numbered list without losing any actual instructions
