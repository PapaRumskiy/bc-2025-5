import { Command } from "commander";
import http from "http";
import fs from "fs/promises";
import path from "path";
import superagent from "superagent";

const program = new Command();

program
  .requiredOption("-h, --host <host>", "Server host (обов'язковий параметр)")
  .requiredOption("-p, --port <port>", "Server port (обов'язковий параметр)")
  .requiredOption("-c, --cache <cacheDir>", "Path to cache directory (обов'язковий параметр)");

program.parse(process.argv);
const { host, port, cache } = program.opts();

const cacheDir = path.resolve(cache);

// створюємо директорію кешу, якщо немає
await fs.mkdir(cacheDir, { recursive: true });

const server = http.createServer(async (req, res) => {
  const method = req.method;
  const code = req.url.slice(1); // наприклад, /200 → "200"
  const filePath = path.join(cacheDir, `${code}.jpg`);

  if (!code) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    return res.end("Bad Request — відсутній код статусу");
  }

  try {
    // -------------------- GET --------------------
    if (method === "GET") {
      try {
        const data = await fs.readFile(filePath);
        res.writeHead(200, { "Content-Type": "image/jpeg" });
        return res.end(data);
      } catch {
        // якщо немає в кеші — пробуємо отримати з http.cat
        try {
          const response = await superagent.get(`https://http.cat/${code}`);
          const image = response.body;
          await fs.writeFile(filePath, image);
          res.writeHead(200, { "Content-Type": "image/jpeg" });
          return res.end(image);
        } catch {
          res.writeHead(404, { "Content-Type": "text/plain" });
          return res.end("Not Found");
        }
      }
    }

    // -------------------- PUT --------------------
    else if (method === "PUT") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const buffer = Buffer.concat(chunks);
      await fs.writeFile(filePath, buffer);
      res.writeHead(201, { "Content-Type": "text/plain" });
      return res.end("Created");
    }

    // -------------------- DELETE --------------------
    else if (method === "DELETE") {
      await fs.unlink(filePath);
      res.writeHead(200, { "Content-Type": "text/plain" });
      return res.end("Deleted");
    }

    // -------------------- Інші методи --------------------
    else {
      res.writeHead(405, { "Content-Type": "text/plain" });
      return res.end("Method Not Allowed");
    }
  } catch (err) {
    console.error("Помилка:", err.message);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
});

server.listen(port, host, () => {
  console.log(`🚀 Сервер запущено на http://${host}:${port}`);
});
