document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const chatContainer = document.getElementById('chatContainer');
  const messagesList = document.getElementById('messagesList');
  const chatForm = document.getElementById('chatForm');
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const charCount = document.getElementById('charCount');
  const coldStartNotice = document.getElementById('coldStartNotice');
  const starterChips = document.getElementById('starterChips');
  const statusText = document.getElementById('statusText');
  const clearBtn = document.getElementById('clearBtn');
  const aboutBtn = document.getElementById('aboutBtn');
  const aboutModal = document.getElementById('aboutModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const dismissModalBtn = document.getElementById('dismissModalBtn');

  // In-memory conversation history: stores { role: 'user' | 'assistant', content: string }
  let conversationHistory = [];
  let isAwaitingResponse = false;
  let coldStartTimer = null;

  // Initialize: Check server health
  checkHealth();

  // Auto-resize input textarea and manage character counter
  messageInput.addEventListener('input', () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 140) + 'px';

    const length = messageInput.value.length;
    charCount.textContent = `${length}/500`;

    if (length >= 480) {
      charCount.className = 'char-count danger';
    } else if (length >= 400) {
      charCount.className = 'char-count warning';
    } else {
      charCount.className = 'char-count';
    }

    sendBtn.disabled = isAwaitingResponse || length === 0 || messageInput.value.trim().length === 0;
  });

  // Handle Enter key (send) vs Shift+Enter (new line)
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) {
        chatForm.dispatchEvent(new Event('submit'));
      }
    }
  });

  // Form submit handler
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userText = messageInput.value.trim();
    if (!userText || isAwaitingResponse) return;

    // Send user message
    await handleSendMessage(userText);
  });

  // Starter chips click handler
  if (starterChips) {
    starterChips.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip || isAwaitingResponse) return;
      const prompt = chip.dataset.prompt;
      if (prompt) {
        handleSendMessage(prompt);
      }
    });
  }

  // Clear conversation handler
  clearBtn.addEventListener('click', () => {
    if (confirm('Reset this conversation?')) {
      conversationHistory = [];
      messagesList.innerHTML = `
        <div class="message-row assistant">
          <div class="avatar">⚡</div>
          <div class="message-bubble">
            <div class="message-header">
              <span class="sender-name">GPT-OSS-20B</span>
              <span class="model-tag">Groq LPUs</span>
            </div>
            <div class="message-body">
              <p>Conversation reset. What would you like to explore next?</p>
            </div>
          </div>
        </div>
      `;
      if (starterChips) starterChips.classList.remove('hidden');
      scrollToBottom();
    }
  });

  // Modal Open/Close handlers
  aboutBtn.addEventListener('click', () => aboutModal.classList.remove('hidden'));
  closeModalBtn.addEventListener('click', () => aboutModal.classList.add('hidden'));
  dismissModalBtn.addEventListener('click', () => aboutModal.classList.add('hidden'));
  aboutModal.addEventListener('click', (e) => {
    if (e.target === aboutModal) aboutModal.classList.add('hidden');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !aboutModal.classList.contains('hidden')) {
      aboutModal.classList.add('hidden');
    }
  });

  // Core Send Logic
  async function handleSendMessage(text) {
    isAwaitingResponse = true;
    sendBtn.disabled = true;
    messageInput.value = '';
    messageInput.style.height = 'auto';
    charCount.textContent = '0/500';

    // Hide starter chips after first message
    if (starterChips) {
      starterChips.classList.add('hidden');
    }

    // Render user message bubble
    appendMessageBubble('user', text);
    scrollToBottom();

    // Show typing indicator
    const typingIndicatorEl = showTypingIndicator();
    scrollToBottom();

    // Start cold-start detection timer (shows reminder if Render is waking up)
    coldStartTimer = setTimeout(() => {
      coldStartNotice.classList.remove('hidden');
      scrollToBottom();
    }, 4000);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: conversationHistory
        })
      });

      clearTimeout(coldStartTimer);
      coldStartNotice.classList.add('hidden');
      removeTypingIndicator(typingIndicatorEl);

      const data = await response.json();

      if (!response.ok) {
        const errorText = data.error || `Server returned error (${response.status})`;
        appendErrorBubble(errorText);
      } else {
        // Render assistant reply
        appendMessageBubble('assistant', data.reply, data.model);

        // Update in-memory history (limit history to last 10 turns)
        conversationHistory.push({ role: 'user', content: text });
        conversationHistory.push({ role: 'assistant', content: data.reply });
        if (conversationHistory.length > 10) {
          conversationHistory = conversationHistory.slice(-10);
        }
      }
    } catch (err) {
      clearTimeout(coldStartTimer);
      coldStartNotice.classList.add('hidden');
      removeTypingIndicator(typingIndicatorEl);
      console.error('Fetch error:', err);
      appendErrorBubble('Network connection failed or request timed out. Please check your connection.');
    } finally {
      isAwaitingResponse = false;
      sendBtn.disabled = false;
      messageInput.focus();
      scrollToBottom();
    }
  }

  // Render message bubble
  function appendMessageBubble(role, content, modelName) {
    const row = document.createElement('div');
    row.className = `message-row ${role}`;

    const isUser = role === 'user';
    const avatarIcon = isUser ? '👤' : '⚡';
    const sender = isUser ? 'You' : 'GPT-OSS-20B';
    const modelTag = isUser ? '' : `<span class="model-tag">${escapeHtml(modelName || 'gpt-oss-20b')}</span>`;

    const formattedContent = formatMarkdown(content);

    row.innerHTML = `
      <div class="avatar">${avatarIcon}</div>
      <div class="message-bubble">
        <div class="message-header">
          <span class="sender-name">${sender}</span>
          ${modelTag}
        </div>
        <div class="message-body">${formattedContent}</div>
      </div>
    `;

    messagesList.appendChild(row);
  }

  // Render error bubble
  function appendErrorBubble(errorMessage) {
    const row = document.createElement('div');
    row.className = 'message-row assistant';
    row.innerHTML = `
      <div class="avatar" style="border-color: #ef4444; color: #ef4444;">⚠️</div>
      <div class="message-bubble" style="border-color: #ef4444; background: rgba(239, 68, 68, 0.1);">
        <div class="message-header">
          <span class="sender-name" style="color: #ef4444;">System Alert</span>
        </div>
        <div class="message-body" style="color: #fca5a5;">
          <p>${escapeHtml(errorMessage)}</p>
        </div>
      </div>
    `;
    messagesList.appendChild(row);
  }

  // Typing indicator
  function showTypingIndicator() {
    const row = document.createElement('div');
    row.className = 'message-row assistant';
    row.id = 'activeTypingIndicator';
    row.innerHTML = `
      <div class="avatar">⚡</div>
      <div class="message-bubble typing-bubble">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    messagesList.appendChild(row);
    return row;
  }

  function removeTypingIndicator(el) {
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }

  // Auto-scroll to bottom of chat
  function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Check health and update status dot
  async function checkHealth() {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        if (data.groqConfigured) {
          statusText.textContent = `${data.model} • Ready`;
        } else {
          statusText.textContent = 'API Key Needed (.env)';
          statusText.style.color = '#f59e0b';
        }
      }
    } catch {
      statusText.textContent = 'Offline / Connecting...';
    }
  }

  // Lightweight markdown and code block parser
  function formatMarkdown(rawText) {
    let text = escapeHtml(rawText);

    // Format multiline code blocks: ```lang ... ```
    text = text.replace(/```([a-zA-Z0-9_]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang || 'code';
      return `<pre><div style="font-size: 0.7rem; color: #818cf8; margin-bottom: 4px; text-transform: uppercase;">${language}</div><code>${code.trim()}</code></pre>`;
    });

    // Format inline code: `code`
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Format bold: **text**
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Format italics: *text*
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Split paragraphs
    const paragraphs = text.split(/\n\n+/);
    return paragraphs
      .map(p => {
        const trimmed = p.trim();
        if (trimmed.startsWith('<pre') || trimmed.startsWith('<ul>') || trimmed.startsWith('<ol>')) {
          return trimmed;
        }
        return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
      })
      .join('');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
});
