

```markdown

\# Plan: GPT-OSS-20B Chatbot Portfolio Project



\## 🎯 Goal

Build and deploy a public, link-shareable chatbot web app for a resume/portfolio.

A recruiter should be able to open a URL, type a message, and get a live response

from `openai/gpt-oss-20b` via the Groq API. Entirely free-tier hosted.



\---



\## 🏗️ Architecture



```



\[Browser: Frontend]  --->  \[Backend API (Node/Express)]  --->  \[Groq API: gpt-oss-20b]

(static HTML/JS)          (holds secret API key)              (LLM inference)



```



Key principle: \*\*Never call the Groq API directly from the browser.\*\* The API key

must live only on the backend server (as an environment variable), otherwise

anyone can steal it from the frontend JS/network tab.



\---



\## 🧰 Tech Stack



| Layer      | Choice                                   | Why |

|------------|-------------------------------------------|-----|

| Frontend   | Plain HTML/CSS/JS (or React if preferred) | Simple, fast to build, no build step needed |

| Backend    | Node.js + Express                        | Simple proxy server, easy to deploy on Render |

| LLM API    | Groq API, model = `openai/gpt-oss-20b`   | Free tier, hosts gpt-oss-20b natively, fast |

| Hosting    | Render.com (free tier, Web Service)      | Free HTTPS URL, auto-deploy from GitHub |

| Version control | GitHub repo                         | Needed for Render auto-deploy + shows on resume |



\---



\## 📁 Project Structure



```



gpt-oss-chatbot/

├── server.js              # Express backend + static file serving

├── package.json

├── .env                    # GROQ\_API\_KEY (local only, gitignored)

├── .env.example

├── .gitignore

├── public/

│   ├── index.html

│   ├── style.css

│   └── script.js

└── README.md



```



\---



\## 🔑 Step 1: Get API Access



1\. Sign up at https://console.groq.com (free).

2\. Create an API key.

3\. Confirm `openai/gpt-oss-20b` is listed under available models.

4\. Save the key — it will go into an environment variable, never into code.



\#note i have api key



\---



\## 🖥️ Step 2: Backend (server.js)



Responsibilities:

\- Serve the static frontend files from `/public`.

\- Expose one endpoint: `POST /api/chat`

\- Read `GROQ\_API\_KEY` from `process.env`

\- Forward the user's message to Groq, return the model's reply as JSON.

\- Handle errors gracefully (rate limits, timeouts) with a user-friendly message.



Pseudocode for the Groq call:



```js

const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {

&#x20; method: "POST",

&#x20; headers: {

&#x20;   "Authorization": `Bearer ${process.env.GROQ\_API\_KEY}`,

&#x20;   "Content-Type": "application/json"

&#x20; },

&#x20; body: JSON.stringify({

&#x20;   model: "openai/gpt-oss-20b",

&#x20;   messages: \[

&#x20;     { role: "system", content: "You are a helpful portfolio assistant." },

&#x20;     { role: "user", content: userMessage }

&#x20;   ]

&#x20; })

});

```



Endpoint contract:



\* Request: `{ "message": "Hi" }`

\* Response: `{ "reply": "Hello! How can I help you today?" }`

\* Errors: return `{ "error": "..." }` with appropriate status code



Also implement:



\* Basic rate limiting (e.g. `express-rate-limit`) so the free API key/hosting

&#x20; isn't abused by a shared public link.

\* Message length cap (e.g. 500 chars) to control token usage/cost.

\* CORS: only needed if frontend/backend are on different domains (not the case

&#x20; here since backend serves the frontend).



\---



\## 🎨 Step 3: Frontend (public/)



\* Simple chat UI: message list + input box + send button.

\* On send: POST to `/api/chat`, show a "typing…" indicator, then render reply.

\* Keep a short in-memory conversation history in the browser (array of

&#x20; `{role, content}`) and send it with each request so the bot has context.

\* Clean, resume-worthy visual design — dark mode, simple bubble UI, maybe a

&#x20; short intro message like "Hi, I'm a chatbot demo built by \[Your Name] using

&#x20; gpt-oss-20b via Groq."

\* Add a small footer: link to GitHub repo + your portfolio/LinkedIn.



\---



\## 🔐 Step 4: Environment Variables



`.env.example`:



```



GROQ\_API\_KEY=your\_key\_here

PORT=3000



```



Add `.env` to `.gitignore`. Never commit the real key.



\---



\## 🧪 Step 5: Local Testing



1\. `npm install`

2\. Create `.env` with your real key

3\. `npm start`

4\. Open `http://localhost:3000`, test sending messages

5\. Test error cases: empty message, network failure, invalid API key



\---



\## 🚀 Step 6: Deploy on Render (Free Tier)



1\. Push project to a public GitHub repo.

2\. Go to https://render.com → New → Web Service → connect the repo.

3\. Settings:

&#x20;  \* Build command: `npm install`

&#x20;  \* Start command: `node server.js`

&#x20;  \* Instance type: Free

4\. Add environment variable in Render dashboard: `GROQ\_API\_KEY = <your key>`

5\. Deploy → Render gives you a public URL like

&#x20;  `https://gpt-oss-chatbot.onrender.com`

6\. Note: Render free tier spins down after inactivity — first request after

&#x20;  idle may take \~30-50s to "wake up." Mention this in the README so

&#x20;  recruiters aren't confused, or add a small loading message in the UI for

&#x20;  the first request.



\---



\## 📝 Step 7: README.md (for GitHub + resume link)



Include:



\* Project title + one-line description

\* \*\*Live demo link\*\* (bold, at the top)

\* Screenshot/GIF of the chat UI

\* Tech stack list

\* Architecture diagram (the one above)

\* How to run locally

\* Notes on free-tier cold start

\* Your name / contact / LinkedIn



\---



\## ✅ Step 8: Polish for Recruiters



\* \[ ] Custom favicon + page title (not "Untitled")

\* \[ ] Mobile-responsive layout

\* \[ ] Add a "Reset conversation" button

\* \[ ] Add rate limit / usage cap so free API quota isn't exhausted

\* \[ ] Add a short "About this project" modal or section explaining what it

&#x20;     demonstrates (API integration, prompt handling, full-stack deployment)

\* \[ ] Pin the repo on your GitHub profile

\* \[ ] Add the live link to your resume/portfolio site directly



\---



\## 🧩 Optional Stretch Goals (if time allows)



\* Streaming responses (token-by-token) using Groq's streaming API for a nicer UX

\* Switchable system prompt / persona selector

\* Save chat history in localStorage

\* Add a "copy code" button for code blocks in responses (use a markdown renderer)

\* Deploy frontend separately on Vercel/Netlify and backend on Render, to show

&#x20; knowledge of decoupled architecture (optional — not required for MVP)

```





