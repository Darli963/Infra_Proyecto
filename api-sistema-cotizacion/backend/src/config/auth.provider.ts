import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { config } from "./env";

export interface AuthTokenPayload {
  sub: string;       // dealership id (local) o Cognito sub
  email: string;
  provider: "local" | "cognito";
}

export interface AuthProvider {
  hashPassword(plain: string): Promise<string>;
  verifyPassword(plain: string, hash: string): Promise<boolean>;
  signToken(payload: AuthTokenPayload): string;
  verifyToken(token: string): AuthTokenPayload;
}

// ─── Proveedor local (JWT + bcrypt) ──────────────────────────────────────────

const localProvider: AuthProvider = {
  hashPassword:  (plain) => bcrypt.hash(plain, 10),
  verifyPassword: (plain, hash) => bcrypt.compare(plain, hash),
  signToken: (payload) =>
    jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as jwt.SignOptions["expiresIn"],
    }),
  verifyToken: (token) =>
    jwt.verify(token, config.jwt.secret) as AuthTokenPayload,
};

// ─── Selección de proveedor ───────────────────────────────────────────────────
// En Cognito el proveedor real se carga en cognito.service.ts.
// auth.provider exporta siempre la interfaz; el servicio de auth
// llama a cognitoInitiateAuth directamente cuando AUTH_PROVIDER=cognito.

export function getAuthProvider(): AuthProvider {
  if (config.authProvider === "cognito") {
    // Importación lazy para no fallar si el SDK no está instalado en local sin AWS
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { cognitoProvider } = require("./cognito.service") as { cognitoProvider: AuthProvider };
    return cognitoProvider;
  }
  return localProvider;
}

export const authProvider: AuthProvider = getAuthProvider();
