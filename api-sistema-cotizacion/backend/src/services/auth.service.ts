import prisma from "../config/prisma";
import { authProvider } from "../config/auth.provider";

export interface RegisterInput {
  name: string;
  slug: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.dealership.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw Object.assign(new Error("Email ya registrado"), { status: 409 });
    }

    const slugTaken = await prisma.dealership.findUnique({
      where: { slug: input.slug },
    });
    if (slugTaken) {
      throw Object.assign(new Error("Slug no disponible"), { status: 409 });
    }

    const passwordHash = await authProvider.hashPassword(input.password);

    const dealership = await prisma.dealership.create({
      data: {
        name: input.name,
        slug: input.slug,
        email: input.email,
        passwordHash,
        phone: input.phone,
      },
      select: { id: true, name: true, slug: true, email: true, createdAt: true },
    });

    const token = authProvider.signToken({
      sub: dealership.id,
      email: dealership.email,
      provider: "local",
    });

    return { dealership, token };
  },

  async login(input: LoginInput) {
    const dealership = await prisma.dealership.findUnique({
      where: { email: input.email },
    });

    if (!dealership || !dealership.active) {
      throw Object.assign(new Error("Credenciales inválidas"), { status: 401 });
    }

    const valid = await authProvider.verifyPassword(
      input.password,
      dealership.passwordHash
    );
    if (!valid) {
      throw Object.assign(new Error("Credenciales inválidas"), { status: 401 });
    }

    const token = authProvider.signToken({
      sub: dealership.id,
      email: dealership.email,
      provider: "local",
    });

    const { passwordHash: _, ...safe } = dealership;
    return { dealership: safe, token };
  },
};
