// 役割: 現在のGroq APIキーで利用可能なモデルの一覧を取得・表示するスクリプト
import * as dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  console.error("エラー: 環境変数 GROQ_API_KEY が設定されていません。");
  process.exit(1);
}

async function fetchAvailableGroqModels() {
  try {
    console.log("Groq APIキーに紐づく利用可能なモデルを照会中...");
    
    // Groqのモデル一覧取得用エンドポイント
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`APIリクエスト失敗: ${response.status} ${response.statusText} ${JSON.stringify(errorData)}`);
    }

    const data: any = await response.json();
    
    // data.data 配列内にモデル情報が入っています
    const models = data.data.map((m: any) => m.id);

    console.log("\n【現在のGroq APIキーで利用可能なモデル一覧】");
    models.sort().forEach((id: string) => console.log(`- ${id}`));
    
  } catch (error) {
    console.error("モデル一覧の取得中にエラーが発生しました:", error);
  }
}

fetchAvailableGroqModels();