import { relative, resolve, sep } from "node:path";
import { distRoot } from "./build";

export function serveSite() {
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: Number(process.env.PORT ?? 4175),
    async fetch(request) {
      const pathname = decodeURIComponent(new URL(request.url).pathname);
      const path = resolve(distRoot, `.${pathname === "/" ? "/index.html" : pathname}`);
      const location = relative(distRoot, path);
      if (location === ".." || location.startsWith(`..${sep}`) || location.startsWith(sep)) {
        return new Response("Not found", { status: 404 });
      }
      const file = Bun.file(path);
      return await file.exists() ? new Response(file) : new Response("Not found", { status: 404 });
    },
  });
  console.log(`temoto preview: ${server.url}`);
  return server;
}

if (import.meta.main) serveSite();
