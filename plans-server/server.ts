// Serves ~/plans (symlinked HTML plan files) with a directory index.
// No caching so edits on this machine show up live on refresh.
import { readdir, stat, realpath } from "node:fs/promises";
import { join, normalize } from "node:path";

const ROOT = `${process.env.HOME}/plans`;
const PORT = Number(process.env.PORT ?? 7788);
const HOST = process.env.HOST ?? "127.0.0.1";

function indexHtml(entries: { name: string; mtime: Date }[]) {
  const rows = entries
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
    .map(
      (e) =>
        `<li><a href="/${encodeURIComponent(e.name)}">${e.name}</a>` +
        ` <span class="m">${e.mtime.toISOString().slice(0, 16).replace("T", " ")}</span></li>`,
    )
    .join("\n");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Plans</title>
<style>body{font:15px/1.6 system-ui;background:#f7f8fa;color:#21262f;max-width:760px;margin:40px auto;padding:0 20px}
a{color:#2f6fb2;text-decoration:none}a:hover{text-decoration:underline}
.m{color:#5f6775;font-size:12px;margin-left:8px}ul{list-style:none;padding:0}li{padding:4px 0}</style>
</head><body><h1>Plans</h1><ul>${rows}</ul></body></html>`;
}

Bun.serve({
  port: PORT,
  hostname: HOST,
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = decodeURIComponent(url.pathname);

    if (pathname === "/" || pathname === "/index.html") {
      const names = (await readdir(ROOT)).filter((n) => !n.startsWith("."));
      const entries = [];
      for (const name of names) {
        try {
          const s = await stat(join(ROOT, name)); // follows symlinks
          if (s.isFile()) entries.push({ name, mtime: s.mtime });
        } catch {} // dangling symlink — skip
      }
      return new Response(indexHtml(entries), {
        headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
      });
    }

    // Only serve direct children of ROOT (symlinks allowed, traversal not)
    const name = normalize(pathname).replace(/^\/+/, "");
    if (name.includes("/") || name.includes("..") || name.startsWith(".")) {
      return new Response("not found", { status: 404 });
    }
    try {
      const target = await realpath(join(ROOT, name));
      const file = Bun.file(target);
      if (!(await file.exists())) return new Response("not found", { status: 404 });
      return new Response(file, { headers: { "cache-control": "no-store" } });
    } catch {
      return new Response("not found", { status: 404 });
    }
  },
});

console.log(`plans-server listening on http://127.0.0.1:${PORT} serving ${ROOT}`);
