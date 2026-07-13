const http = require("http");
const mysql = require("mysql2/promise");
const { Signer } = require("@aws-sdk/rds-signer");
const { Client: PgClient } = require("pg");
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

const port = Number(process.env.PORT || 3000);
const region = process.env.AWS_REGION || "us-east-1";
const secretName = process.env.PHASE4_AURORA_SECRET_NAME || "";

const secretsClient = new SecretsManagerClient({ region });

async function loadDatabaseConfig() {
  if (!secretName) {
    throw new Error("PHASE4_AURORA_SECRET_NAME no esta definido");
  }

  const response = await secretsClient.send(
    new GetSecretValueCommand({
      SecretId: secretName
    })
  );

  if (!response.SecretString) {
    throw new Error(`El secreto ${secretName} no contiene SecretString`);
  }

  return JSON.parse(response.SecretString);
}

async function checkDatabase() {
  const config = await loadDatabaseConfig();
  const authType = config.auth_type || "password";

  if (String(config.engine || "").startsWith("aurora-postgresql")) {
    const password =
      authType === "iam"
        ? await new Signer({
            hostname: config.host,
            port: Number(config.port),
            username: config.username,
            region
          }).getAuthToken()
        : config.password;

    const client = new PgClient({
      host: config.host,
      port: Number(config.port),
      user: config.username,
      password,
      database: config.dbname,
      connectionTimeoutMillis: 15000,
      query_timeout: 15000,
      statement_timeout: 15000,
      ssl: {
        rejectUnauthorized: false
      }
    });

    await client.connect();

    try {
      const result = await client.query("SELECT 1 AS ok");
      return {
        ok: result.rows[0]?.ok === 1,
        endpoint: config.host,
        database: config.dbname,
        engine: config.engine,
        authType
      };
    } finally {
      await client.end();
    }
  }

  const connection = await mysql.createConnection({
    host: config.host,
    port: Number(config.port),
    user: config.username,
    password: config.password,
    database: config.dbname,
    connectTimeout: 5000,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const [rows] = await connection.query("SELECT 1 AS ok");
    return {
      ok: rows[0]?.ok === 1,
      endpoint: config.host,
      database: config.dbname,
      engine: config.engine,
      authType
    };
  } finally {
    await connection.end();
  }
}

function respondJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json"
  });
  response.end(JSON.stringify(payload));
}

const server = http.createServer(async (request, response) => {
  if (request.url === "/healthz") {
    return respondJson(response, 200, {
      status: "ok",
      service: "phase4-smoke-app",
      region,
      secretConfigured: secretName.length > 0
    });
  }

  if (request.url === "/db-check") {
    try {
      const result = await checkDatabase();
      return respondJson(response, 200, {
        status: "ok",
        database: result
      });
    } catch (error) {
      console.error(JSON.stringify({ level: "error", message: `Fallo db-check: ${error.message}`, timestamp: new Date().toISOString() }));
      return respondJson(response, 500, {
        status: "error",
        message: error.message
      });
    }
  }

  return respondJson(response, 200, {
    status: "ok",
    message: "EC2 privada lista para validar la Fase 4",
    endpoints: ["/healthz", "/db-check"]
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`phase4-smoke-app escuchando en http://0.0.0.0:${port}`);
});
