import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";

export interface QuoteRuleInput {
  motorcycleId?: string | null;
  name: string;
  factor: number;
  fixedCharge?: number;
  currency?: string;
  description?: string;
  active?: boolean;
}

export const quoteRuleService = {
  async list(dealershipId: string) {
    return prisma.quoteRule.findMany({
      where: { dealershipId },
      orderBy: { createdAt: "desc" },
      include: { motorcycle: { select: { id: true, brand: true, model: true } } },
    });
  },

  async findOwned(id: string, dealershipId: string) {
    const rule = await prisma.quoteRule.findUnique({ where: { id } });
    if (!rule) throw Object.assign(new Error("Regla no encontrada"), { status: 404 });
    if (rule.dealershipId !== dealershipId) throw Object.assign(new Error("Sin acceso"), { status: 403 });
    return rule;
  },

  async create(dealershipId: string, input: QuoteRuleInput) {
    // Valida que la moto pertenezca a la concesionaria si se especifica
    if (input.motorcycleId) {
      const moto = await prisma.motorcycle.findUnique({ where: { id: input.motorcycleId } });
      if (!moto || moto.dealershipId !== dealershipId)
        throw Object.assign(new Error("Motocicleta no válida"), { status: 400 });
    }
    return prisma.quoteRule.create({
      data: {
        dealershipId,
        motorcycleId: input.motorcycleId ?? null,
        name:         input.name,
        factor:       new Prisma.Decimal(input.factor),
        fixedCharge:  new Prisma.Decimal(input.fixedCharge ?? 0),
        currency:     input.currency ?? "USD",
        description:  input.description,
        active:       input.active ?? true,
      },
    });
  },

  async update(id: string, dealershipId: string, input: Partial<QuoteRuleInput>) {
    await quoteRuleService.findOwned(id, dealershipId);
    return prisma.quoteRule.update({
      where: { id },
      data: {
        ...input,
        ...(input.factor      !== undefined && { factor:      new Prisma.Decimal(input.factor) }),
        ...(input.fixedCharge !== undefined && { fixedCharge: new Prisma.Decimal(input.fixedCharge) }),
      },
    });
  },

  async remove(id: string, dealershipId: string) {
    await quoteRuleService.findOwned(id, dealershipId);
    await prisma.quoteRule.delete({ where: { id } });
  },
};
