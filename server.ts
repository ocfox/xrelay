import { Hono } from "hono";

interface Env {
  SUBSTITUTERS: string;
  PRIORITY: string;
}

async function race(upstreams: string[], path: string): Promise<Response> {
  const controllers = upstreams.map(() => new AbortController());
  const abortOthers = (winner: number) =>
    controllers.forEach((c, i) => i !== winner && c.abort());

  return Promise.any(
    upstreams.map((base, i) =>
      fetch(base + path, { signal: controllers[i].signal }).then((res) => {
        if (!res.ok) throw new Error();
        abortOthers(i);
        return res;
      }),
    ),
  ).catch(() => new Response("Not found", { status: 404 }));
}

const app = new Hono<{ Bindings: Env }>();

app.get("/nix-cache-info", (c) =>
  c.text(`StoreDir=/nix/store\nWantMassQuery=1\nPriority=${c.env.PRIORITY}\n`),
);

app.on(["GET", "HEAD"], "/:filename", async (c) => {
  const filename = c.req.param("filename");
  if (!filename.endsWith(".narinfo")) return c.notFound();
  return race(c.env.SUBSTITUTERS.split(" "), `/${filename}`);
});

app.on(["GET", "HEAD"], "/nar/*", (c) =>
  race(c.env.SUBSTITUTERS.split(" "), c.req.path),
);

export default app;
