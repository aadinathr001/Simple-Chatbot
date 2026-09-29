const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');

test('GET / serves the frontend index.html', async () => {
  const res = await request(app).get('/');
  assert.equal(res.status, 200);
  assert.match(res.headers['content-type'], /text\/html/);
  assert.match(res.text, /GPT-OSS-20B Assistant/);
});

test('GET /api/health returns health status and configuration details', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
  assert.equal(typeof res.body.model, 'string');
  assert.equal(typeof res.body.groqConfigured, 'boolean');
});

test('POST /api/chat rejects empty or missing message with 400', async () => {
  const resEmpty = await request(app)
    .post('/api/chat')
    .send({ message: '' });
  assert.equal(resEmpty.status, 400);
  assert.match(resEmpty.body.error, /required/i);

  const resWhitespace = await request(app)
    .post('/api/chat')
    .send({ message: '     ' });
  assert.equal(resWhitespace.status, 400);

  const resMissing = await request(app)
    .post('/api/chat')
    .send({});
  assert.equal(resMissing.status, 400);
});

test('POST /api/chat rejects messages longer than 500 characters with 400', async () => {
  const longMessage = 'A'.repeat(501);
  const res = await request(app)
    .post('/api/chat')
    .send({ message: longMessage });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /500 character limit/i);
});

test('POST /api/chat validates unconfigured GROQ_API_KEY gracefully with 500', async () => {
  // If GROQ_API_KEY is not set or placeholder
  const originalKey = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;

  try {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'Hello' });
    assert.equal(res.status, 500);
    assert.match(res.body.error, /GROQ_API_KEY is not configured/i);
  } finally {
    if (originalKey) {
      process.env.GROQ_API_KEY = originalKey;
    }
  }
});
