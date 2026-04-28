// 役割: Reactフロントエンドからのリクエストを中継し、Groq APIを安全に呼び出すバックエンドサーバー
import * as dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import Groq from 'groq-sdk'; // npm install groq-sdk

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


const upload = multer({ storage: multer.memoryStorage() });

const apiKey = process.env.GROQ_API_KEY;
console.log('取得されたAPIキー:', apiKey ? '設定されています(末尾4桁: ' + apiKey.slice(-4) + ')' : '未設定です');

if (!apiKey) {
  console.error('【エラー】GROQ_API_KEY が .env ファイルに見つかりません。');
  process.exit(1);
}

const groq = new Groq({ 
  apiKey: apiKey, 
});


// --- エンドポイント定義 ---

app.get('/debug', (req: Request, res: Response) => {
  console.log('DEBUGリクエストを受信しました');
  res.status(200).json({ status: 'alive', message: 'Expressは正常に動作しています' });
});

// 1. モデル一覧取得 (GET http://localhost:3001/api/models)
app.get('/api/models', async (_req: Request, res: Response) => {
  console.log('GET /api/models - Groqモデル一覧の照会リクエストを受信しました。');
  try {
    const list = await groq.models.list();
    
    // フロントエンドが使いやすいように整形
    const models = list.data.map((m: any) => ({
      id: m.id,
      displayName: m.id, // GroqはIDがそのまま名前として分かりやすいため
    }));

    console.log(`成功: ${models.length} 個のモデルを返却します。`);
    res.json({ models });
  } catch (error: any) {
    console.error('【バックエンドエラー】:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 2. 解析 (POST http://localhost:3001/api/analyze)
// ※ GroqのVision対応モデル（Llama-3-70b-Instructなど）を使用する場合の例
app.post('/api/analyze', upload.single('image'), async (req: any, res: any) => {
  console.log('POST /api/analyze - 解析リクエストを受信しました。');
  try {
    const file = req.file;
    const { prompt, model: modelName } = req.body;

    if (!file) return res.status(400).json({ error: '画像がアップロードされていません。' });

    // 画像をBase64データURLに変換
    const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    const chatCompletion = await groq.chat.completions.create({
      "messages": [
        {
          "role": "user",
          "content": [
            { "type": "text", "text": prompt },
            {
              "type": "image_url",
              "image_url": { "url": base64Image }
            }
          ]
        }
      ],
      "model": modelName || "llama-3.2-11b-vision-preview", // Vision対応モデルを指定
    });

    const text = chatCompletion.choices[0]?.message?.content || "";
    const usage = chatCompletion.usage;

    res.json({ text, usage });
  } catch (error: any) {
    console.error('【解析エラー】:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log('--------------------------------------------------');
  console.log(`Groq Backend Server is running on http://localhost:${PORT}`);
  console.log('--------------------------------------------------');
});