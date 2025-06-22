import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({
  origin: ['https://just-ask-chat-bot.vercel.app'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const API_KEY = process.env.OPENROUTER_API_KEY?.trim();
if (!API_KEY) {
  console.error("❌ No API_KEY found in environment.");
  process.exit(1);
}
console.log("✅ Loaded key:", API_KEY.substring(0, 12) + "...");

app.get('/test', async (req, res) => {
  try {
    const models = await axios.get('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    res.json(models.data);
  } catch (err) {
    console.error("❌ /test failed:", err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

app.get('/test-key', async (req, res) => {
  try {
    const r = await axios.get('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    res.json({ ok: true, count: r.data.data.length });
  } catch(e) {
    console.error("🔴 /test-key failed:", e.response?.data);
    res.status(500).json({ ok: false, error: e.response?.data });
  }
});


app.post('/chat', async (req, res) => {
  const { message, model } = req.body;
  const modelToUse = model === 'openrouter/auto'
    ? 'mistralai/mixtral-8x7b-instruct'
    : model;

  console.log("📨 Received chat request:", { message, model: modelToUse });
  console.log("🧾 Using API Key:", API_KEY.slice(0, 12) + "...");

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: modelToUse,
        messages: [{ role: 'user', content: message }],
        max_tokens: 100,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'User-Agent': 'JustAskBot (https://just-ask-chat-bot.vercel.app)',
          'HTTP-Referer': 'https://just-ask-chat-bot.vercel.app'
        }
      }
    );

    const reply = response.data.choices?.[0]?.message?.content || 'No reply';
    const usedModel = response.data.model;
    res.json({ reply, model: usedModel });

  } catch (err) {
    console.warn("❌ Chat failed:", err.response?.data || err.message);
    res.status(500).json({
      error: err.response?.data || err.message
    });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`✨ Server running on port ${port}`));
