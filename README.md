# ⚡ Simple Chatbot

A link-shareable AI chatbot powered by **`openai/gpt-oss-20b`** through Groq's low-latency inference API. Built with a secure FastAPI backend, rate limiting, and a responsive dark-mode frontend.

**[🚀 Live Demo](https://simple-chatbot-kkxd.onrender.com/)**

---

## 📌 Features

* **AI-powered conversations** — Chat with `openai/gpt-oss-20b` using Groq's inference API.
* **Secure API proxy** — Keeps your Groq API key on the server, never exposing it to the browser.
* **Rate limiting** — IP-based request limits using SlowAPI (30 requests per 15 minutes).
* **Input validation** — Pydantic schema enforcement and a 500-character message limit.
* **Conversation memory** — In-memory multi-turn context with a bounded token budget.
* **Responsive UI** — Clean, dark-mode interface that works across devices.
* **Cold-start handling** — Loading notice for Render's free-tier wake-up delay.

---

## 🏗️ Architecture

```text
          Browser
       (HTML / CSS / JS)
              |
              | POST /api/chat
              ▼
      FastAPI Backend
    (Validation / Rate Limit)
              |
              | Server-side API key
              ▼
         Groq Cloud API
       (openai/gpt-oss-20b)
              |
              ▼
         Chat Response
```

### Key Design Principles

| Principle           | Implementation                                                       |
| ------------------- | -------------------------------------------------------------------- |
| API key security    | `GROQ_API_KEY` is stored in server environment variables.            |
| Abuse prevention    | SlowAPI limits requests by IP address.                               |
| Input validation    | Pydantic schemas and a 500-character input cap.                      |
| Conversation memory | In-memory multi-turn conversation state with a bounded token budget. |
| Cold-start handling | Frontend displays a loading notice while the server wakes up.        |

---

## 🛠️ Tech Stack

| Layer           | Technology                        |
| --------------- | --------------------------------- |
| Frontend        | HTML5, CSS3, Vanilla JavaScript   |
| Backend         | Python 3, FastAPI, Uvicorn        |
| LLM             | Groq Cloud — `openai/gpt-oss-20b` |
| Rate Limiting   | SlowAPI                           |
| Validation      | Pydantic                          |
| Testing         | Pytest, FastAPI TestClient        |
| Hosting         | Render (Free Tier)                |
| Version Control | Git & GitHub                      |

---

## 📂 Project Structure

```text
simple-chatbot/
│
├── main.py                 # FastAPI app and API proxy
├── test_main.py            # Pytest test suite
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variable template
│
├── public/
│   ├── index.html          # Chat interface
│   ├── style.css           # Frontend styling
│   └── script.js           # Chat functionality
│
└── README.md
```

---

## 🚀 Getting Started

Follow these steps to run the chatbot locally.

### Prerequisites

* Python 3 installed
* Git
* A [Groq API key](https://console.groq.com/keys)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/simple-chatbot.git
cd simple-chatbot
```

Replace `YOUR_USERNAME/simple-chatbot` with your actual GitHub repository URL.

### 2. Create a Virtual Environment

```bash
python -m venv venv
```

**Activate the environment:**

**Windows (PowerShell):**

```powershell
.\venv\Scripts\Activate.ps1
```

**Windows (Command Prompt):**

```cmd
venv\Scripts\activate
```

**Linux / macOS:**

```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Copy the example environment file:

**Windows (PowerShell):**

```powershell
Copy-Item .env.example .env
```

**Linux / macOS:**

```bash
cp .env.example .env
```

Open `.env` and add your Groq API key:

```env
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-20b
PORT=8000
```

**Important:** Replace the placeholder with your actual API key. Never commit your `.env` file or expose your API key publicly.

### 5. Run Tests

```bash
pytest -v
```

### 6. Start the Server

```bash
python main.py
```

Open the chatbot in your browser:

**http://127.0.0.1:8000**

Health check endpoint:

**http://127.0.0.1:8000/api/health**

---

## ☁️ Deployment on Render

This project can be deployed on [Render](https://render.com/) with automatic deployment from GitHub.

### Step 1: Push to GitHub

Commit and push your project to a GitHub repository.

### Step 2: Create a Render Web Service

1. Sign in to [Render](https://render.com/).
2. Select **New → Web Service**.
3. Connect your GitHub account and select your repository.
4. Configure the service using the settings below.

### Step 3: Configure the Service

| Setting       | Value                                          |
| ------------- | ---------------------------------------------- |
| Runtime       | Python                                         |
| Build Command | `pip install -r requirements.txt`              |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Instance Type | Free                                           |

### Step 4: Add Environment Variables

In your Render service's **Environment** settings, add:

| Key            | Value                    |
| -------------- | ------------------------ |
| `GROQ_API_KEY` | Your actual Groq API key |
| `GROQ_MODEL`   | `openai/gpt-oss-20b`     |

### Step 5: Deploy

Click **Deploy** and wait for the build to finish. Render will provide a public HTTPS URL for your chatbot.

> **Note:** Render's free-tier services may spin down after a period of inactivity. The first request after inactivity can take around 30–50 seconds or longer to respond while the service starts up. The frontend displays a loading notice during this delay.

---

## 🔐 Security

This project uses several measures to help protect the backend and API key:

* **Server-side API key:** The Groq API key is kept in environment variables and is not sent to the frontend.
* **Rate limiting:** Limits requests to 30 per IP address within 15 minutes.
* **Input validation:** Validates incoming requests with Pydantic and limits message length.
* **Environment configuration:** Uses a `.env` file for local development and environment variables on Render.

For local development, make sure `.env` is listed in `.gitignore` before committing your project.

---

## 🧪 Testing

The project includes a Pytest test suite using FastAPI's `TestClient`.

Run all tests with:

```bash
pytest -v
```

---

## 📄 License

This project is licensed under the **MIT License**.

See the [LICENSE](LICENSE) file for details, if included in the repository.

---

## 👨‍💻 Author

**Aadinath R**

[GitHub](https://github.com/aadinathr001)
