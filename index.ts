import "dotenv/config";
import express from "express";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
// 💡 先生のアドバイス通り、インデックスまでしっかり指定！
import { PrismaClient } from "./generated/prisma/index.js";
import path from "path";
import { fileURLToPath } from "url";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, log: ["query"] });

const app = express();
const PORT = process.env.PORT || 8888;

// ESモジュールで __dirname を使えるようにする設定
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// JSONデータをパースできるようにする（Reactとの通信に必須）
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 💡 デモ用ユーザー作成 API ---
app.post("/api/seed", async (req: any, res: any) => {
  try {
    const user = await prisma.user.upsert({
      where: { email: "demo@example.com" },
      update: {},
      create: { name: "デモ太郎", email: "demo@example.com", budget_limit: 100000 }
    });
    res.json({ message: "デモユーザーを用意しました", user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- 💰 収支記録機能 API ---
app.get("/api/transactions", async (req: any, res: any) => {
  try {
    const transactions = await prisma.transaction.findMany({ orderBy: { date: "desc" } });
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/transactions", async (req: any, res: any) => {
  const { userId, amount, category, type, date } = req.body;
  try {
    const transaction = await prisma.transaction.create({
      data: {
        userId: Number(userId),
        amount: Number(amount),
        category,
        type,
        date: date ? new Date(date) : new Date()
      }
    });
    res.json(transaction);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// --- 📊 月別推移グラフ用 API ---
app.get("/api/analysis/trends", async (req: any, res: any) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { type: "expense" }
    });

    const monthlyData: Record<string, number> = {};
    transactions.forEach(t => {
      const month = new Date(t.date).toISOString().substring(0, 7);
      monthlyData[month] = (monthlyData[month] || 0) + t.amount;
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const labels = sortedMonths;
    const data = sortedMonths.map(m => monthlyData[m]);

    res.json({ labels, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- 🏆 ランキング機能 API ---
app.get("/api/ranking", async (req: any, res: any) => {
  try {
    const users = await prisma.user.findMany({
      include: { transactions: true }
    });

    const ranking = users.map(user => {
      const totalExpense = user.transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      return { id: user.id, name: user.name, totalExpense };
    }).sort((a, b) => a.totalExpense - b.totalExpense);

    res.json(ranking);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- 📦 フロントエンド（React）の静的ファイルを配信する設定 ---
app.use(express.static(path.join(__dirname, "frontend/dist")));
app.get("*", (req: any, res: any) => {
  res.sendFile(path.join(__dirname, "frontend/dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});