import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({
  origin: ['https://just-ask-chat-bot.vercel.app'],
  methods: ['GET','POST'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use(express.json());

const API_KEY = process.env.OPENROUTER_API_KEY?.trim();
if (!API_KEY) {
  console.error("❌ No API_KEY found in environment.");
  process.exit(1);
}
console.log("✅ Loaded key:", API_KEY.substring(0,12)+"...");

app.get('/test', async (req,res) => {
  try {
    const models = await axios.get('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    res.json(models.data);
  } catch(err) {
    console.error("❌ /test failed:", err.response?.data || err.message);
    res.status(500).json({error:err.response?.data || err.message});
  }
});

app.post('/chat', async (req,res) => {
  console.log("📨 Received chat request:", req.body);
  try {
    const {message,model} = req.body;
    const modelToUse = model==='openrouter/auto'
      ? 'mistralai/mixtral-8x7b-instruct'
      : model;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      { model: modelToUse, messages:[{role:'user',content:message}], max_tokens:50 },
      { headers: { Authorization: `Bearer ${API_KEY}` } }
    );

    res.json({reply:response.data.choices[0].message.content});
  } catch(err) {
    console.warn("❌ Chat failed:", err.response?.data || err.message);
    res.status(500).json({error:err.response?.data || err.message});
  }
});

const port = process.env.PORT || 3001;
app.listen(port,()=>console.log(`✨ Server running on port ${port}`));
