const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

// Security and utility middleware
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate Limiter: max 30 chat requests per 15 minutes per IP
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP. Please wait a few minutes before trying again.'
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const isKeyConfigured = Boolean(
    process.env.GROQ_API_KEY &&
    !process.env.GROQ_API_KEY.includes('your_groq_api_key_here')
  );

  res.status(200).json({
    status: 'ok',
    model: GROQ_MODEL,
    groqConfigured: isKeyConfigured,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Chat endpoint
app.post('/api/chat', chatLimiter, async (req, res) => {
  try {
    const { message, history } = req.body;

    // Validate user message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length > 500) {
      return res.status(400).json({
        error: `Message exceeds the 500 character limit (currently ${trimmedMessage.length} characters).`
      });
    }

    // Verify Groq API Key is present
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey.includes('your_groq_api_key_here')) {
      return res.status(500).json({
        error: 'GROQ_API_KEY is not configured on the server. Please set it in your .env file or host environment.'
      });
    }

    // Sanitize conversation history if provided (limit to last 10 messages)
    const validHistory = [];
    if (Array.isArray(history)) {
      const sanitized = history
        .filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
        .slice(-10)
        .map(item => ({
          role: item.role,
          content: item.content.slice(0, 1000)
        }));
      validHistory.push(...sanitized);
    }

    // Construct message payload for Groq
    const messages = [
      {
        role: 'system',
        content:
          'You are a professional, friendly, and knowledgeable portfolio AI assistant powered by openai/gpt-oss-20b on Groq. ' +
          'Provide clear, concise, and helpful responses. Format code snippets or structured data using markdown when appropriate.'
      },
      ...validHistory,
      {
        role: 'user',
        content: trimmedMessage
      }
    ];

    // Call Groq API with 25-second abort timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1024
      }),
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));

    if (!groqResponse.ok) {
      let errorMessage = `Groq API returned status ${groqResponse.status}`;
      try {
        const errorData = await groqResponse.json();
        if (errorData?.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        // Fall back to HTTP status
      }

      if (groqResponse.status === 429) {
        return res.status(429).json({ error: 'Groq API rate limit exceeded. Please wait a moment and try again.' });
      } else if (groqResponse.status === 401) {
        return res.status(401).json({ error: 'Invalid Groq API key. Please check your credentials.' });
      }

      return res.status(502).json({ error: errorMessage });
    }

    const data = await groqResponse.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(502).json({ error: 'Received an empty response from the AI model.' });
    }

    return res.status(200).json({
      reply,
      model: data.model || GROQ_MODEL
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Request to Groq API timed out. Please try again.' });
    }
    console.error('Server error processing chat request:', err);
    return res.status(500).json({ error: 'An unexpected server error occurred. Please try again later.' });
  }
});

// Fallback route: serve index.html for single-page application navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start listening if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🤖 Chatbot server running at http://localhost:${PORT}`);
    console.log(`Using Groq model: ${GROQ_MODEL}`);
  });
}

module.exports = app;
