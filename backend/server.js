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

const API_KEY = process.env.OPENROUTER_API_KEYS?.trim() || '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';

if (!API_KEY) {
  console.error("❌ No API key found. Make sure 'OPENROUTER_API_KEYS' is set.");
  process.exit(1);
}

console.log('✅ Loaded key:', API_KEY.slice(0, 12) + '...');

const DEFAULT_AUTO_MODEL = 'mistralai/mixtral-8x7b-instruct';

app.post('/chat', async (req, res) => {
  const { message, model } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const selectedModel = model === 'openrouter/auto' ? DEFAULT_AUTO_MODEL : model;


  console.log(`📨 Received message: "${message}" with model: "${selectedModel}"`);

  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'User-Agent': 'JustAskBot (https://just-ask-chat-bot.vercel.app)',
    'Referer': 'https://just-ask-chat-bot.vercel.app' // ✅ FIXED HERE
  };

  console.log("🧾 Headers being sent to OpenRouter:", headers);

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: selectedModel,
        messages: [{ role: 'user', content: message }],
        max_tokens: 50,
        temperature: 0.7,
      },
      { headers }
    );

    const reply = response.data.choices[0].message.content;
    const usedModel = response.data.model;
    console.log('✅ OpenRouter responded successfully');
    return res.json({ reply, model: usedModel });

  } catch (err) {
  
    console.warn("❌ API request failed — OpenRouter returned an error");
    console.error(err.response?.data || err.message); 
    console.error("🧾 Status code:", err.response?.status || 'No status');
    console.error("🧾 Response headers:", err.response?.headers || 'No headers');

    return res.status(500).json({
      reply: `[!] Request failed — ${err.response?.data?.error?.message || err.message}`,
      model: selectedModel,
    });
  }
});

app.get('/test', async (req, res) => {
  try {
    const response = await axios.get('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'User-Agent': 'JustAskBot (https://just-ask-chat-bot.vercel.app)',
        'Referer': 'https://just-ask-chat-bot.vercel.app'
      }
    });
    res.json({ models: response.data });
  } catch (err) {
    console.error("❌ Test failed:", err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
