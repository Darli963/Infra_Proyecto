import http from "http";
import assert from "assert";

async function request(options: {
  port: number;
  path: string;
  method?: string;
  headers?: Record<string, string>;
}): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: "127.0.0.1",
      port: options.port,
      path: options.path,
      method: options.method ?? "GET",
      headers: options.headers,
    }, (res: any) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk: string) => { body += chunk; });
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode ?? 500,
          body,
        });
      });
    });

    req.on("error", reject);
    req.end();
  });
}

async function main() {
  process.env.AUTH_PROVIDER = "cognito";
  process.env.AWS_REGION = process.env.AWS_REGION ?? "us-east-1";
  process.env.COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID ?? "us-east-1_example";
  process.env.COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID ?? "example-client-id";

  const express = (await import("express")).default;
  const { requireAuth } = await import("../src/middlewares/auth.middleware");

  const app = express();
  app.get("/api/public/ping", (_req: any, res: any) => {
    res.status(200).json({ status: "ok" });
  });
  app.get("/api/dealer/ping", requireAuth, (_req: any, res: any) => {
    res.status(200).json({ status: "ok" });
  });

  const server = await new Promise<http.Server>((resolve, reject) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    instance.on("error", reject);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("No se pudo abrir el servidor de prueba");
  }

  try {
    const noToken = await request({ port: address.port, path: "/api/dealer/ping" });
    assert.strictEqual(noToken.statusCode, 401, "Sin token debe responder 401 en /api/dealer/*");

    const invalidToken = await request({
      port: address.port,
      path: "/api/dealer/ping",
      headers: { Authorization: "Bearer invalid.token.value" },
    });
    assert.strictEqual(invalidToken.statusCode, 401, "Token inválido debe responder 401 en /api/dealer/*");

    const publicRoute = await request({ port: address.port, path: "/api/public/ping" });
    assert.strictEqual(publicRoute.statusCode, 200, "Ruta /api/public/* debe funcionar sin token");

    console.log("OK: auth cognito middleware");
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error: any) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
