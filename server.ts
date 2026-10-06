import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// よくある相談パターン集（個人情報を除いた、過去の相談から抽出したパターン）
interface Pattern {
  category: string;
  symptoms: string[];
  likely_causes: string[];
  typical_fix: string[];
}

let PATTERNS: Pattern[] = [];
try {
  const patternsPath = path.join(process.cwd(), "src", "knowledge", "patterns.json");
  PATTERNS = JSON.parse(fs.readFileSync(patternsPath, "utf-8"));
} catch (e) {
  console.warn("patterns.json を読み込めませんでした。パターン参照なしで動作します。", e);
}

// 相談内容と関連しそうなパターンを簡易キーワード一致で絞り込む（最大3件）
function findRelevantPatterns(message: string | undefined): Pattern[] {
  if (!message || PATTERNS.length === 0) return [];
  const text = message;
  const scored = PATTERNS.map((p) => {
    const haystack = [p.category, ...p.symptoms].join(" ");
    let score = 0;
    for (const word of haystack.split(/[\s・、。]/).filter((w) => w.length >= 2)) {
      if (text.includes(word)) score += 1;
    }
    return { p, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.p);
}

function patternsToReferenceText(patterns: Pattern[]): string {
  if (patterns.length === 0) return "";
  const blocks = patterns.map((p) => {
    return `■${p.category}\n考えられる原因: ${p.likely_causes.join(" / ") || "(特になし)"}\n対処の例: ${p.typical_fix.join(" → ")}`;
  });
  return `\n\n【参考：過去によくあった似た相談と対処例（個人情報は含みません。あくまで参考であり、必ずしもこの通りとは限らないことに注意）】\n${blocks.join("\n\n")}`;
}

let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please set it in Settings > Secrets.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });
  }
  return aiInstance;
}

const SUPPORT_SYSTEM_INSTRUCTION = `あなたは高齢者にスマホの使い方をやさしく教える「ＡＩスマホ先生」です。
守ること：
- やさしいひらがな多めの日本語。むずかしいカタカナ語は使わない（使うときは言いかえを添える）。
- 一度に案内する操作は1つだけ。終わったら「できましたか？」と聞く。
- 機種（iPhone/Android）が不明なら、最初にそれだけを聞く。
- 次の形で書く：
【目的】
【今の状態】
【次の操作】
【確認 / 補足】
- お金・暗証番号・パスワードを求められる話が出たら、すぐ「教えないで、家族か188に相談」と伝える。
- 画面の写真（スクリーンショット）が送られてきたら、その中身をよく見て、今どの画面にいるかを判断してから案内する。
- 【次の操作】では、押す場所を「設定（歯車のマーク）」「Wi-Fi」「写真」「カメラ」「LINE」「削除」「鍵マーク」「戻る」「ホーム画面」「検索」「電話」のような、決まった言葉で表現する（見た目のアイコンと対応する言葉を使う）。`;

const CHECK_SYSTEM_INSTRUCTION = `あなたは高齢者の詐欺・フィッシング相談員です。
送られてきたメールやSMSの文章を読み、詐欺やフィッシングの可能性を判定してください。
最初の1行に「あぶない」「ちゅうい」「たぶん大丈夫」のどれか1つだけを書き、
そのあと改行して理由と、するべきこと（リンクは押さない、家族か消費者ホットライン188に電話、など）を
やさしい日本語で短く書いてください。`;

function buildContents(message: string | undefined, image: string | undefined, history: any[] | undefined) {
  const contents: any[] = [];
  if (history && Array.isArray(history)) {
    history.forEach((turn: any) => {
      contents.push({ role: turn.role, parts: [{ text: turn.text }] });
    });
  }
  const currentParts: any[] = [];
  if (message) currentParts.push({ text: message });
  else if (!image) currentParts.push({ text: "" });
  if (image) {
    const matches = image.match(/^data:([^;]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      currentParts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
    }
  }
  contents.push({ role: "user", parts: currentParts });
  return contents;
}

// 503（混雑）やネットワーク系エラー時に、少し待って最大2回まで自動で再試行する
async function generateContentWithRetry(
  client: GoogleGenAI,
  params: Parameters<GoogleGenAI["models"]["generateContent"]>[0],
  maxRetries = 2
) {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await client.models.generateContent(params);
    } catch (error: any) {
      lastError = error;
      const status = error?.status || error?.code;
      const isRetryable = status === 503 || status === "UNAVAILABLE" || status === 429;
      if (!isRetryable || attempt === maxRetries) throw error;
      const waitMs = 1000 * (attempt + 1); // 1秒、2秒と待ち時間を延ばす
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  // 相談チャット（テキスト + 任意で画面の写真）
  app.post("/api/support", async (req, res) => {
    try {
      const { message, image, history } = req.body;
      let client;
      try {
        client = getGeminiClient();
      } catch (gkError: any) {
        return res.status(403).json({
          error: "API_KEY_MISSING",
          message: gkError.message || "GEMINI_API_KEY is required. Please configure it in Settings > Secrets.",
        });
      }

      const relevant = findRelevantPatterns(message);
      const systemInstruction = SUPPORT_SYSTEM_INSTRUCTION + patternsToReferenceText(relevant);

      const response = await generateContentWithRetry(client, {
        model: "gemini-3.8-flash",
        contents: buildContents(message, image, history),
        config: { systemInstruction, temperature: 0.2 },
      });

      res.json({ text: response.text || "" });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      const status = error?.status || error?.code;
      if (status === 503 || status === "UNAVAILABLE" || status === 429) {
        return res.status(503).json({
          error: "BUSY",
          message: "今、AIが混み合っています。30秒ほど待ってから、もう一度「送る」を押してみてください。",
        });
      }
      res.status(500).json({ error: "INTERNAL_ERROR", message: error.message || "" });
    }
  });

  // あやしいメッセージ判定
  app.post("/api/check", async (req, res) => {
    try {
      const { message } = req.body;
      let client;
      try {
        client = getGeminiClient();
      } catch (gkError: any) {
        return res.status(403).json({
          error: "API_KEY_MISSING",
          message: gkError.message || "GEMINI_API_KEY is required. Please configure it in Settings > Secrets.",
        });
      }

      const response = await generateContentWithRetry(client, {
        model: "gemini-3.8-flash",
        contents: [{ role: "user", parts: [{ text: message || "" }] }],
        config: { systemInstruction: CHECK_SYSTEM_INSTRUCTION, temperature: 0.1 },
      });

      res.json({ text: response.text || "" });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      const status = error?.status || error?.code;
      if (status === 503 || status === "UNAVAILABLE" || status === 429) {
        return res.status(503).json({
          error: "BUSY",
          message: "今、AIが混み合っています。30秒ほど待ってから、もう一度お試しください。",
        });
      }
      res.status(500).json({ error: "INTERNAL_ERROR", message: error.message || "" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
}

startServer();
