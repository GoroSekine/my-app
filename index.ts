import "dotenv/config";
import express from "express";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
// ↓ ここを 「/index.js」 までしっかり書くのが本番で動かすコツじゃ！
import { PrismaClient } from "./generated/prisma/index.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, log: ["query"] });

const app = express();
const PORT = process.env.PORT || 8888;

app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.urlencoded({ extended: true }));

// 型の警告を消すために、引数に型を添えてもよいし、そのままでも tsx なら動くぞ
app.get("/", async (req: any, res: any) => {
  const users = await prisma.user.findMany();
  res.render("index", { users });
});

app.post("/users", async (req: any, res: any) => {
  const name = req.body.name;
  if (name) {
    await prisma.user.create({ data: { name } });
  }
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
