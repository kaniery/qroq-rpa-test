// 役割: 画像をGemini APIに送信し、指定したUI要素の座標を推測させる検証用スクリプト
// AI向け役割: テキストプロンプトと画像データをマルチモーダルモデルに渡し、推論結果を標準出力に返す。
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import * as fs from "fs";

// 環境変数の読み込み
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("エラー: 環境変数 GEMINI_API_KEY が設定されていません。");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// 画像ファイルをAPIに渡せるBase64形式に変換
function fileToGenerativePart(path: string, mimeType: string) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType
    },
  };
}

async function runTest() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = "この画面のスクリーンショットを見てください。「確認」ボタンや、それに類する主要なアクションボタンは画面のどの位置にありますか？ [ymin, xmin, ymax, xmax] のように、0から1000の相対座標で推測して出力してください。";
    
    // 用意したテスト画像のパスとMIMEタイプを指定
    const imagePath = "paizaScreen.png";
    if (!fs.existsSync(imagePath)) {
      console.error(`エラー: 画像ファイル ${imagePath} が見つかりません。`);
      return;
    }
    const imagePart = fileToGenerativePart(imagePath, "image/png");

    console.log("AIに問い合わせ中...");
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    
    console.log("【AIの推測結果】\n", response.text());
  } catch (error) {
    console.error("APIの実行中にエラーが発生しました:", error);
  }
}

runTest();