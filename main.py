import os
import time
from typing import List, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
import groq
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Load environment variables from .env file
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
PORT = int(os.getenv("PORT", 8000))

# Initialize Rate Limiter: max 30 requests per 15 minutes per IP
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="GPT-OSS-20B Chatbot API",
    description="API proxy for gpt powered by Groq Cloud",
    version="1.0.0"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request / Response Schemas
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=500, description="User's prompt message (max 500 chars)")
    history: Optional[List[ChatMessage]] = Field(default=None, description="Previous conversation turns")

class ChatResponse(BaseModel):
    reply: str
    model: str

# Health Check Route
@app.get("/api/health")
async def health_check():
    current_key = os.getenv("GROQ_API_KEY", "")
    is_configured = bool(current_key and "your_groq_api_key_here" not in current_key)
    return {
        "status": "ok",
        "model": os.getenv("GROQ_MODEL", GROQ_MODEL),
        "groqConfigured": is_configured,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

# Chat Completion Route
@app.post("/api/chat", response_model=ChatResponse)
@limiter.limit("30/15minute")
async def chat_endpoint(request: Request, body: ChatRequest):
    trimmed_message = body.message.strip()
    if not trimmed_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message text cannot be empty or solely whitespace."
        )

    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key or "your_groq_api_key_here" in api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GROQ_API_KEY is not configured on the server. Please set it in your .env file or host environment."
        )

    # Sanitize and truncate conversation history (keep last 10 messages)
    history_messages = []
    if body.history:
        for item in body.history[-10:]:
            if item.role in ("user", "assistant") and item.content:
                history_messages.append({
                    "role": item.role,
                    "content": item.content[:1000]
                })

    # Assemble payload for Groq
    system_prompt = {
        "role": "system",
        "content": (
            "You are a professional, courteous, and knowledgeable AI assistant "
            "Provide clear and very concise, and helpful responses exactly to the question asked. "
            "Format code snippets and structured concepts using clean markdown formatting."
        )
    }

    groq_messages = [system_prompt, *history_messages, {"role": "user", "content": trimmed_message}]
    target_model = os.getenv("GROQ_MODEL", GROQ_MODEL)

    try:
        client = groq.AsyncGroq(api_key=api_key, timeout=25.0)
        completion = await client.chat.completions.create(
            model=target_model,
            messages=groq_messages,
            temperature=0.7,
            max_tokens=1024,
        )

        reply_content = completion.choices[0].message.content
        if not reply_content:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Received an empty response from Groq."
            )

        return ChatResponse(
            reply=reply_content,
            model=completion.model or target_model
        )

    except groq.RateLimitError:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Groq API rate limit exceeded. Please wait a moment and try again."
        )
    except groq.AuthenticationError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Groq API key configured on the server."
        )
    except groq.APIConnectionError:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Connection to Groq API timed out. Please try again."
        )
    except groq.APIError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Groq API error: {e.message}"
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected server error occurred: {str(e)}"
        )

# Mount static files to serve the frontend UI
public_dir = os.path.join(os.path.dirname(__file__), "public")
if os.path.exists(public_dir):
    app.mount("/", StaticFiles(directory=public_dir, html=True), name="public")

# Fallback for SPA routing
@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    index_file = os.path.join(public_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    raise HTTPException(status_code=404, detail="File not found")

if __name__ == "__main__":
    import sys
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
    import uvicorn
    print(f"[*] Chatbot server running at http://127.0.0.1:{PORT}")
    print(f"[*] Using Groq model: {GROQ_MODEL}")
    uvicorn.run("main:app", host="127.0.0.1", port=PORT, reload=True)
