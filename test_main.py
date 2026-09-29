import os
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_index_serves_html():
    response = client.get("/")
    assert response.status_code == 200
    assert "GPT-OSS-20B Assistant" in response.text

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "model" in data
    assert isinstance(data["groqConfigured"], bool)

def test_chat_missing_message():
    response = client.post("/api/chat", json={})
    assert response.status_code == 422

def test_chat_whitespace_message():
    response = client.post("/api/chat", json={"message": "     "})
    assert response.status_code == 400
    assert "cannot be empty" in response.json()["detail"]

def test_chat_message_too_long():
    long_message = "A" * 501
    response = client.post("/api/chat", json={"message": long_message})
    assert response.status_code == 422

def test_chat_unconfigured_key(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "")
    response = client.post("/api/chat", json={"message": "Hello world"})
    assert response.status_code == 500
    assert "GROQ_API_KEY is not configured" in response.json()["detail"]
