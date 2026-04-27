// 役割: 現在のAPIキーで利用可能なGeminiモデルの一覧を取得・表示するスクリプト
// AI向け役割: REST API経由でモデル一覧を取得し、標準出力にリストアップする。
import * as dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("エラー: 環境変数 GEMINI_API_KEY が設定されていません。");
  process.exit(1);
}

async function fetchAvailableModels() {
  try {
    console.log("APIキーに紐づく利用可能なモデルを照会中...");
    
    // Node.jsの標準fetchを使用してREST APIを直接叩く
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (!response.ok) {
      throw new Error(`APIリクエスト失敗: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // "gemini" を含むモデルの「短い名前」だけを抽出して表示
    const geminiModels = data.models
      .filter((m: any) => m.name.includes("gemini"))
      .map((m: any) => m.name.replace("models/", ""));

    console.log("\n【現在のAPIキーで利用可能なモデル一覧】");
    geminiModels.forEach((name: string) => console.log(`- ${name}`));
    
  } catch (error) {
    console.error("モデル一覧の取得中にエラーが発生しました:", error);
  }
}

fetchAvailableModels();