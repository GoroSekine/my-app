import "dotenv/config";
import express from "express";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma"; // ここは自分の環境に合わせてな

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, log: ["query"] });

const app = express();
const PORT = process.env.PORT || 8888;

// EJS を使って画面を表示するための設定じゃ
app.set("view engine", "ejs");
app.set("views", "./views");
// フォームから送られてきたデータを受け取れるようにする設定じゃ
app.use(express.urlencoded({ extended: true }));

// トップページ（ / ）にアクセスしたときの処理
app.get("/", async (req, res) => {
  const users = await prisma.user.findMany();
  res.render("index", { users });
});

// ユーザーを追加するボタン（ POST /users ）を押したときの処理
app.post("/users", async (req, res) => {
  const name = req.body.name;
  if (name) {
    await prisma.user.create({ data: { name } });
  }
  res.redirect("/"); // 登録が終わったらトップページに戻るぞ
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
