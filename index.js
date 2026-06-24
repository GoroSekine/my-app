import http from "node:http";

// Render などの本番環境では PORT という環境変数でポート番号が指定されるので、
// それがあれば使い、なければ 8888 番を使うようにしておくのじゃ
const PORT = process.env.PORT || 8888;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // 日本語が文字化けしないように charset=utf-8 を指定するのがコツじゃな
  res.setHeader("Content-Type", "text/plain; charset=utf-8");

  if (url.pathname === "/") {
    console.log("GET / にアクセスがあったぞ");
    res.writeHead(200);
    res.end("こんにちは！仙人のアプリへようこそ。");
  } else {
    res.writeHead(404);
    res.end("ページが見つかりませぬ");
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
