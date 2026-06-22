/**
 * Abstracción del proveedor de autenticación.
 *
 * FASE 3: implementación local con JWT.
 * FASE futura: reemplazar por Cognito sin cambiar controladores ni rutas.
 *
 * Para migrar a Cognito:
 *  - Implementar `CognitoAuthProvider` con la misma interfaz.
 *  - Cambiar la exportación de `authProvider` en este archivo.
 *  - Eliminar `passwordHash` del modelo Dealership o mantenerlo vacío.
 */

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { config } from "./env";

export interface AuthTokenPayload {
  sub: string;        // dealership id
  email: string;
  provider: "local" | "cognito";
}

export interface AuthProvider {
  hashPassword(plain: string): Promise<string>;
  verifyPassword(plain: string, hash: string): Promise<boolean>;
  signToken(payload: AuthTokenPayload): string;
  verifyToken(token: string): AuthTokenPayload;
}

const localProvider: AuthProvider = {
  hashPassword: (plain) => bcrypt.hash(plain, 10),

  verifyPassword: (plain, hash) => bcrypt.compare(plain, hash),

  signToken: (payload) =>
    jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as jwt.SignOptions["expiresIn"],
    }),

  verifyToken: (token) =>
    jwt.verify(token, config.jwt.secret) as AuthTokenPayload,
};

export const authProvider: AuthProvider = localProvider;
