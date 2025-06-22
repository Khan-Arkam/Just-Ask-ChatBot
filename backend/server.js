import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();

app.use(cors({
  origin: ['https://just-ask-chat-bot.vercel.app'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const API_KEYS = process.env.OPENROUTER_API_KEYS?.split(',').map(k => k.trim()) || [];

if (API_KEYS.length === 0) {
  console.error("❌ No API keys found. Set OPENROUTER_API_KEYS in .env.");
  process.exit(1);
}

const DEFAULT_AUTO_MODEL = 'mistralai/mixtral-8x7b-instruct';

app.post('/chat', async (req, res) => {
  const { message, model } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const selectedModel = model === 'openrouter/auto' ? DEFAULT_AUTO_MODEL : model;
  const maxTokens = 50;
  const temperature = 0.7;

  let lastErrMessage = 'Unknown error';

  for (let key of API_KEYS) {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: selectedModel,
          messages: [{ role: 'user', content: message }],
          max_tokens: maxTokens,
          temperature,
        },
        {
          headers: {
            Authorization: `Bearer ${key}`,
          },
        }
      );

      const reply = response.data.choices[0].message.content;
      const usedModel = response.data.model;
      return res.json({ reply, model: usedModel });

    } catch (err) {
      const status = err.response?.status;
      const errMsg = err.response?.data?.error?.message || err.message;

      console.warn(`❌ Key failed: ${key?.slice(0, 12)}... — ${errMsg}`);
      lastErrMessage = errMsg;

      if (status !== 402) {
        break;
      }
    }
  }

  return res.status(500).json({
    reply: `[!] All API keys failed. ${lastErrMessage || 'Insufficient credits or invalid key.'}`,
    model: selectedModel,
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
