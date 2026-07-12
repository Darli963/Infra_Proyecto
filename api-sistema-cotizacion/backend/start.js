#!/usr/bin/env node
/**
 * start.js — punto de entrada de producción.
 *
 * Si DATABASE_URL no está definida, lee las credenciales de Aurora
 * desde AWS Secrets Manager (AURORA_SECRET_NAME) y construye la URL.
 * Luego arranca el servidor compilado (dist/server.js).
 */

"use strict";

const { execSync } = require("child_process");

async function resolveDbUrl() {
  if (process.env.DATABASE_URL) return;

  const secretName = process.env.AURORA_SECRET_NAME || process.env.PHASE4_AURORA_SECRET_NAME;
  if (!secretName) {
    console.error("[start] ERROR: Define DATABASE_URL o AURORA_SECRET_NAME");
    process.exit(1);
  }

  const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
  const client = new SecretsManagerClient({ region: process.env.AWS_REGION || "us-east-1" });

  const resp = await client.send(new GetSecretValueCommand({ SecretId: secretName }));
  const secret = JSON.parse(resp.SecretString);

  // El secreto de Aurora tiene: host, port, username, password, dbname, engine
  const { host, port, username, password, dbname } = secret;
  process.env.DATABASE_URL =
    `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port || 5432}/${dbname}?sslmode=require`;

  console.log(`[start] DATABASE_URL construida desde ${secretName} (host: ${host})`);
}

resolveDbUrl()
  .then(() => {
    // Arranca el servidor compilado
    require("./dist/src/server.js");
  })
  .catch((err) => {
    console.error("[start] Error al resolver configuración:", err);
    process.exit(1);
  });
