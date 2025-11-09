// main.js
import { Command } from "commander"; // імпортуємо Commander.js
import http from "http"; // стандартний модуль Node.js для створення серверів
import fs from "fs";
import path from "path";

const program = new Command();

// описуємо аргументи командного рядка
program
  .requiredOption("-h, --host <host>", "Server host (обов'язковий параметр)")
  .requiredOption("-p, --port <port>", "Server port (обов'язковий параметр)")
  .requiredOption("-c, --cache <cacheDir>", "Path to cache directory (обов'язковий параметр)");

program.parse(process.argv);

// отримуємо значення параметрів
const { host, port, cache } = program.opts();

// якщо немає директорії кешу — створюємо
if (!fs.existsSync(cache)) {
  fs.mkdirSync(cache, { recursive: true });
  console.log(`✅ Директорію кешу "${cache}" створено`);
}

// створюємо сервер
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Сервер працює!\n");
});

// запускаємо сервер
server.listen(port, host, () => {
  console.log(`🚀 Сервер запущено на http://${host}:${port}`);
});
