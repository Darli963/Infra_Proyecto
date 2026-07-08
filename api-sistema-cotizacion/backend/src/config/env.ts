import "dotenv/config";

export const config = {
  port:    Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: process.env.DATABASE_URL ?? "",

  jwt: {
    secret:    process.env.JWT_SECRET    ?? "change-me-in-production",
    expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  },

  aws: {
    region:                  process.env.AWS_REGION                    ?? "us-east-1",
    cognitoUserPoolId:       process.env.COGNITO_USER_POOL_ID          ?? "",
    cognitoClientId:         process.env.COGNITO_CLIENT_ID             ?? "",
    cognitoUserPoolEndpoint: process.env.COGNITO_USER_POOL_ENDPOINT    ?? "",
    s3Bucket:                process.env.S3_BUCKET_NAME                ?? "",
    cloudfrontUrl:           process.env.CLOUDFRONT_URL                ?? "",
  },

  // "local" usa JWT+bcrypt; "cognito" usa AWS Cognito
  authProvider: (process.env.AUTH_PROVIDER ?? "local") as "local" | "cognito",
};
