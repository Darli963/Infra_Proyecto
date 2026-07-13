import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";

export interface QuoteProfileInput {
  name: string;
  description?: string;
  factor: number;
  fixedCharge?: number;
  minDownPayment?: number;
  maxMonths?: number;
  active?: boolean;
}

export const quoteProfileService = {
  async list(dealershipId: string) {
    return prisma.quoteProfile.findMany({
      where: { dealershipId },
      orderBy: { createdAt: "desc" },
    });
  },

  async findOwned(id: string, dealershipId: string) {
    const profile = await prisma.quoteProfile.findUnique({ where: { id } });
    if (!profile) throw Object.assign(new Error("Perfil no encontrado"), { status: 404 });
    if (profile.dealershipId !== dealershipId) throw Object.assign(new Error("Sin acceso"), { status: 403 });
    return profile;
  },

  async create(dealershipId: string, input: QuoteProfileInput) {
    return prisma.quoteProfile.create({
      data: {
        dealershipId,
        name:           input.name,
        description:    input.description,
        factor:         new Prisma.Decimal(input.factor),
        fixedCharge:    new Prisma.Decimal(input.fixedCharge ?? 0),
        minDownPayment: new Prisma.Decimal(input.minDownPayment ?? 0),
        maxMonths:      input.maxMonths ?? 12,
        active:         input.active ?? true,
      },
    });
  },

  async update(id: string, dealershipId: string, input: Partial<QuoteProfileInput>) {
    await quoteProfileService.findOwned(id, dealershipId);
    return prisma.quoteProfile.update({
      where: { id },
      data: {
        ...input,
        ...(input.factor         !== undefined && { factor:         new Prisma.Decimal(input.factor) }),
        ...(input.fixedCharge    !== undefined && { fixedCharge:    new Prisma.Decimal(input.fixedCharge) }),
        ...(input.minDownPayment !== undefined && { minDownPayment: new Prisma.Decimal(input.minDownPayment) }),
      },
    });
  },

  async remove(id: string, dealershipId: string) {
    await quoteProfileService.findOwned(id, dealershipId);
    await prisma.quoteProfile.delete({ where: { id } });
  },
};
