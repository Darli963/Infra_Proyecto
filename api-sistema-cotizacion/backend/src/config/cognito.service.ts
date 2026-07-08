import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  AdminGetUserCommand,
  AuthFlowType,
} from "@aws-sdk/client-cognito-identity-provider";
import { createPublicKey, type JsonWebKey } from "crypto";
import https from "https";
import jwt from "jsonwebtoken";
import type { AuthProvider, AuthTokenPayload } from "./auth.provider";
import { config } from "./env";
import prisma from "./prisma";

const client = new CognitoIdentityProviderClient({ region: config.aws.region });

type CognitoJwtPayload = jwt.JwtPayload & {
  client_id?: string;
  username?: string;
  "cognito:username"?: string;
  "custom:dealershipId"?: string;
  token_use?: string;
};

type JwkKey = JsonWebKey & {
  kid?: string;
  alg?: string;
  use?: string;
};

let jwksCache: { expiresAt: number; keys: JwkKey[] } | null = null;

function getCognitoIssuer(): string {
  return config.aws.cognitoUserPoolEndpoint ||
    `https://cognito-idp.${config.aws.region}.amazonaws.com/${config.aws.cognitoUserPoolId}`;
}

function parseJwtHeader(token: string): { kid?: string; alg?: string } {
  const [headerSegment] = token.split(".");
  if (!headerSegment) throw new Error("Token inválido");

  const decoded = Buffer.from(headerSegment, "base64url").toString("utf8");
  return JSON.parse(decoded) as { kid?: string; alg?: string };
}

async function getJwksKeys(): Promise<JwkKey[]> {
  const now = Date.now();
  if (jwksCache && jwksCache.expiresAt > now) return jwksCache.keys;

  const data = await new Promise<{ keys?: JwkKey[] }>((resolve, reject) => {
    https.get(`${getCognitoIssuer()}/.well-known/jwks.json`, (response: any) => {
      if ((response.statusCode ?? 500) >= 400) {
        reject(new Error("No se pudo obtener el JWKS de Cognito"));
        response.resume();
        return;
      }

      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk: string) => { body += chunk; });
      response.on("end", () => {
        try {
          resolve(JSON.parse(body) as { keys?: JwkKey[] });
        } catch {
          reject(new Error("Respuesta inválida del JWKS de Cognito"));
        }
      });
    }).on("error", reject);
  });

  const keys = data.keys ?? [];
  if (keys.length === 0) throw new Error("JWKS de Cognito vacío");

  jwksCache = {
    keys,
    expiresAt: now + (5 * 60 * 1000),
  };

  return keys;
}

async function verifyCognitoJwt(token: string): Promise<CognitoJwtPayload> {
  if (!config.aws.cognitoUserPoolId || !config.aws.cognitoClientId) {
    throw new Error("Cognito no está configurado correctamente");
  }

  const header = parseJwtHeader(token);
  if (header.alg !== "RS256" || !header.kid) {
    throw new Error("Token de Cognito inválido");
  }

  const jwks = await getJwksKeys();
  const jwk = jwks.find((key) => key.kid === header.kid && key.kty === "RSA");
  if (!jwk) throw new Error("No se encontró la clave pública de Cognito");

  const publicKey = createPublicKey({ key: jwk, format: "jwk" });
  const payload = jwt.verify(token, publicKey, {
    algorithms: ["RS256"],
    issuer: getCognitoIssuer(),
  }) as CognitoJwtPayload;

  const audience = payload.aud;
  const clientId = payload.client_id;
  if (audience && audience !== config.aws.cognitoClientId) {
    throw new Error("Audience inválida");
  }
  if (!audience && clientId && clientId !== config.aws.cognitoClientId) {
    throw new Error("Client ID inválido");
  }
  if (!audience && !clientId) {
    throw new Error("Token de Cognito sin audience/client_id");
  }

  return payload;
}

async function resolveLocalDealershipId(payload: CognitoJwtPayload): Promise<string> {
  const tokenDealershipId = payload["custom:dealershipId"];
  if (tokenDealershipId) return String(tokenDealershipId);

  const email = payload.email ?? payload.username ?? payload["cognito:username"];
  if (!email) throw new Error("Token de Cognito sin identidad utilizable");

  const dealership = await prisma.dealership.findUnique({
    where: { email: String(email) },
    select: { id: true, active: true },
  });

  if (!dealership || !dealership.active) {
    throw new Error("Concesionaria no autorizada");
  }

  return dealership.id;
}

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

  verifyToken: async (token: string): Promise<AuthTokenPayload> => {
    const payload = await verifyCognitoJwt(token);
    const dealershipId = await resolveLocalDealershipId(payload);

    return {
      sub:      dealershipId,
      email:    String(payload.email ?? payload.username ?? payload["cognito:username"] ?? ""),
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
