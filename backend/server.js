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

const API_KEY = process.env.OPENROUTER_API_KEYS;

if (!API_KEY) {
  console.error("❌ No API key found. Make sure 'OPENROUTER_API_KEYS' is set.");
  process.exit(1);
}

console.log('✅ Loaded key:', API_KEY.slice(0, 12) + '...');

const DEFAULT_MODEL = 'mistralai/mixtral-8x7b-instruct';

app.post('/chat', async (req, res) => {
  const { message, model } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model === 'openrouter/auto' ? DEFAULT_MODEL : model,
        messages: [{ role: 'user', content: message }],
        max_tokens: 100,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://just-ask-chat-bot.vercel.app/',
          'User-Agent': 'JustAskChatBot (https://just-ask-chat-bot.vercel.app/)'
        }
      }
    );

    return res.json({
      reply: response.data.choices[0].message.content,
      model: response.data.model
    });
  } catch (err) {
    const errMsg = err.response?.data?.error?.message || err.message;
    console.warn(`❌ API request failed — ${errMsg}`);
    return res.status(500).json({ reply: `[!] Request failed — ${errMsg}` });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
