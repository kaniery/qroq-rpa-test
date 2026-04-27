// 役割: Reactフロントエンドからのリクエストを中継し、Gemini APIを安全に呼び出すバックエンドサーバー
// AI向け役割: Expressを使用したREST APIサーバー。モデル一覧取得と画像解析の2つのエンドポイントを /api プレフィックスで提供する。
import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config();

const app = express();

// Middleware
app.use(cors()); // 全ドメインからの通信を許可
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('【エラー】GEMINI_API_KEY が .env ファイルに見つかりません。');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// --- エンドポイント定義 ---

// 1. モデル一覧取得 (GET http://localhost:3001/api/models)
app.get('/api/models', async (_req: Request, res: Response) => {
  console.log('GET /api/models - モデル一覧の照会リクエストを受信しました。');
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google API Error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const models = data.models
      .filter((m: any) => m.name.includes('gemini'))
      .map((m: any) => ({
        id: m.name.replace('models/', ''),
        displayName: m.displayName,
      }));

    console.log(`成功: ${models.length} 個のモデルを返却します。`);
    res.json({ models });
  } catch (error: any) {
    console.error('【バックエンドエラー】:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 2. 画像解析 (POST http://localhost:3001/api/analyze)
app.post('/api/analyze', upload.single('image'), async (req: any, res: any) => {
  console.log('POST /api/analyze - 解析リクエストを受信しました。');
  try {
    const file = req.file;
    const { prompt, model: modelName } = req.body;

    if (!file) return res.status(400).json({ error: '画像がアップロードされていません。' });

    const model = genAI.getGenerativeModel({ model: modelName || 'gemini-flash-latest' });

    const imagePart = {
      inlineData: {
        data: file.buffer.toString('base64'),
        mimeType: file.mimetype
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    const usage = response.usageMetadata;

    res.json({ text, usage });
  } catch (error: any) {
    console.error('【解析エラー】:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// サーバー起動
const PORT = 3001;
app.listen(PORT, () => {
  console.log('--------------------------------------------------');
  console.log(`Backend Server is running on http://localhost:${PORT}`);
  console.log(`- API Models:  http://localhost:${PORT}/api/models`);
  console.log(`- API Analyze: http://localhost:${PORT}/api/analyze (POST)`);
  console.log('--------------------------------------------------');
});