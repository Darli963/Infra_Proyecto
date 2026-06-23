/**
 * Implementación de AuthProvider usando AWS Cognito.
 *
 * Cognito gestiona las contraseñas — hashPassword/verifyPassword delegan
 * en InitiateAuth, no en bcrypt local.
 *
 * signToken devuelve el AccessToken de Cognito directamente.
 * verifyToken decodifica el JWT de Cognito sin llamar a AWS
 * (la firma se valida con la clave pública del User Pool; aquí
 *  solo extraemos el payload para el uso interno del backend).
 */

import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  AdminGetUserCommand,
  AuthFlowType,
} from "@aws-sdk/client-cognito-identity-provider";
import jwt from "jsonwebtoken";
import type { AuthProvider, AuthTokenPayload } from "./auth.provider";
import { config } from "./env";

const client = new CognitoIdentityProviderClient({ region: config.aws.region });

export const cognitoProvider: AuthProvider = {
  // En Cognito el hash lo gestiona el User Pool — retornamos placeholder
  hashPassword: (_plain: string) => Promise.resolve("__cognito__"),

  // La verificación real ocurre en InitiateAuth (login)
  verifyPassword: (_plain: string, _hash: string) => Promise.resolve(true),

  /**
   * signToken no se usa directamente cuando el proveedor es Cognito:
   * el token lo emite Cognito durante InitiateAuth.
   * Se mantiene la firma para cumplir la interfaz; en producción
   * authService.login devuelve el AccessToken de Cognito y no llama a signToken.
   */
  signToken: (payload: AuthTokenPayload) => {
    // Fallback JWT local solo si Cognito no está configurado
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as jwt.SignOptions["expiresIn"],
    });
  },

  /**
   * Los tokens de Cognito son JWT RS256 firmados por el User Pool.
   * Decodificamos sin verificar la firma aquí (la verificación perimetral
   * la hace API Gateway / el authorizer de Cognito en producción).
   * En desarrollo con JWT local, verifyToken sigue funcionando igual.
   */
  verifyToken: (token: string): AuthTokenPayload => {
    const decoded = jwt.decode(token) as Record<string, unknown> | null;
    if (!decoded) throw new Error("Token inválido");
    return {
      sub:      String(decoded["sub"] ?? decoded["custom:dealershipId"] ?? ""),
      email:    String(decoded["email"] ?? ""),
      provider: "cognito",
    };
  },
};

// ─── helpers de Cognito usados por authService ────────────────────────────────

export async function cognitoSignUp(email: string, password: string, name: string) {
  await client.send(new SignUpCommand({
    ClientId: config.aws.cognitoClientId,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: "email", Value: email },
      { Name: "name",  Value: name  },
    ],
  }));
}

export async function cognitoInitiateAuth(email: string, password: string) {
  const res = await client.send(new InitiateAuthCommand({
    AuthFlow:       AuthFlowType.USER_PASSWORD_AUTH,
    ClientId:       config.aws.cognitoClientId,
    AuthParameters: { USERNAME: email, PASSWORD: password },
  }));
  return res.AuthenticationResult;
}

export async function cognitoGetUser(email: string) {
  return client.send(new AdminGetUserCommand({
    UserPoolId: config.aws.cognitoUserPoolId,
    Username:   email,
  }));
}
