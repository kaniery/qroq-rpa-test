// 役割: 画像をGroq APIに送信し、指定したUI要素の座標を推測させる検証用スクリプト
import Groq from "groq-sdk"; // npm install groq-sdk
import * as dotenv from "dotenv";
import * as fs from "fs";

// 環境変数の読み込み
dotenv.config();

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  console.error("エラー: 環境変数 GROQ_API_KEY が設定されていません。");
  process.exit(1);
}

const groq = new Groq({ apiKey });

// 画像ファイルをBase64のData URL形式に変換
function fileToDataURL(path: string, mimeType: string) {
  const base64 = fs.readFileSync(path).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

async function runTest() {
  try {
    const imagePath = "paizaScreen.png";
    if (!fs.existsSync(imagePath)) {
      console.error(`エラー: 画像ファイル ${imagePath} が見つかりません。`);
      return;
    }

    const dataUrl = fileToDataURL(imagePath, "image/png");

    const prompt = "この画面のスクリーンショットを見てください。「確認」ボタンや、それに類する主要なアクションボタンは画面のどの位置にありますか？ [ymin, xmin, ymax, xmax] のように、0から1000の相対座標で推測して出力してください。";

    console.log("Groq AIに問い合わせ中...");

    const chatCompletion = await groq.chat.completions.create({
      "messages": [
        {
          "role": "user",
          "content": [
            { "type": "text", "text": prompt },
            {
              "type": "image_url",
              "image_url": { "url": dataUrl }
            }
          ]
        }
      ],
      // Vision対応モデル（Llama 3.2系など）を指定
      "model": "llama-3.2-11b-vision-preview",
      "temperature": 0.2, // 座標推論なので低めの温度がおすすめ
    });

    console.log("【AIの推測結果】\n", chatCompletion.choices[0]?.message?.content);
    
    // トークン使用量の表示（任意）
    if (chatCompletion.usage) {
      console.log("\n(Usage:", chatCompletion.usage.total_tokens, "tokens)");
    }
    
  } catch (error: any) {
    console.error("APIの実行中にエラーが発生しました:", error.message);
  }
}

runTest();