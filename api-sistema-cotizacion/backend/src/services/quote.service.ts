import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";

// ─── tipos de entrada ────────────────────────────────────────────────────────

export interface QuoteResponse {
  questionId: string;
  optionId?:  string;  // para SINGLE_CHOICE / MULTIPLE_CHOICE
  textValue?: string;  // para TEXT / NUMBER / BOOLEAN
}

export interface SimulateInput {
  motorcycleId:   string;
  applicantName:  string;
  applicantEmail: string;
  responses:      QuoteResponse[];
}

// ─── lógica pública: catálogo ─────────────────────────────────────────────────

const publicMotoSelect = {
  id: true, brand: true, model: true, year: true,
  engineCC: true, price: true, currency: true,
  category: true, description: true,
  images: { orderBy: { sortOrder: "asc" as const } },
};

export const publicService = {
  listMotorcycles(filters: { search?: string; category?: string; page?: number; limit?: number }) {
    const page  = Math.max(1, filters.page  ?? 1);
    const limit = Math.min(100, filters.limit ?? 20);
    const skip  = (page - 1) * limit;

    const where: Prisma.MotorcycleWhereInput = {
      active: true,
      dealership: { active: true },
      ...(filters.category && { category: filters.category }),
      ...(filters.search && {
        OR: [
          { brand: { contains: filters.search, mode: "insensitive" } },
          { model: { contains: filters.search, mode: "insensitive" } },
        ],
      }),
    };

    return Promise.all([
      prisma.motorcycle.count({ where }),
      prisma.motorcycle.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, select: publicMotoSelect }),
    ]).then(([total, items]) => ({ items, total, page, limit, pages: Math.ceil(total / limit) }));
  },

  async getMotorcycle(id: string) {
    const moto = await prisma.motorcycle.findFirst({
      where: { id, active: true, dealership: { active: true } },
      select: publicMotoSelect,
    });
    if (!moto) throw Object.assign(new Error("Motocicleta no encontrada"), { status: 404 });
    return moto;
  },

  getRiskQuestions() {
    return prisma.riskQuestion.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: { options: { orderBy: { sortOrder: "asc" } } },
    });
  },
};

// ─── motor de cotización ──────────────────────────────────────────────────────

export const quoteEngine = {
  async simulate(input: SimulateInput) {
    // 1. Cargar moto con su concesionaria
    const moto = await prisma.motorcycle.findFirst({
      where: { id: input.motorcycleId, active: true },
      include: { dealership: true },
    });
    if (!moto) throw Object.assign(new Error("Motocicleta no disponible"), { status: 404 });
    if (!moto.dealership.active) throw Object.assign(new Error("Concesionaria inactiva"), { status: 404 });

    // 2. Obtener regla activa: primero busca específica de la moto, luego global de la concesionaria
    const rule = await prisma.quoteRule.findFirst({
      where: {
        dealershipId: moto.dealershipId,
        active: true,
        OR: [{ motorcycleId: moto.id }, { motorcycleId: null }],
      },
      orderBy: { motorcycleId: "desc" }, // las específicas (no-null) primero
    });

    // 3. Resolver factores de riesgo de las respuestas con opción seleccionada
    const optionIds = input.responses.flatMap(r => r.optionId ? [r.optionId] : []);
    const options = optionIds.length
      ? await prisma.riskQuestionOption.findMany({ where: { id: { in: optionIds } } })
      : [];

    const optionMap = new Map(options.map(o => [o.id, o]));

    // 4. Cálculo aritmético en JS con Decimal para evitar errores de punto flotante
    const basePrice   = new Prisma.Decimal(moto.price);
    const ruleFactor  = rule ? new Prisma.Decimal(rule.factor)      : new Prisma.Decimal(1);
    const ruleCharge  = rule ? new Prisma.Decimal(rule.fixedCharge) : new Prisma.Decimal(0);

    // Producto de todos los factores de riesgo (multiplicativo)
    let riskFactor = new Prisma.Decimal(1);
    const riskBreakdown: { questionId: string; optionId?: string; label?: string; factor: string }[] = [];

    for (const resp of input.responses) {
      if (resp.optionId) {
        const opt = optionMap.get(resp.optionId);
        if (opt) {
          const f = new Prisma.Decimal(opt.riskFactor);
          riskFactor = riskFactor.mul(f);
          riskBreakdown.push({ questionId: resp.questionId, optionId: opt.id, label: opt.label, factor: f.toFixed(4) });
        }
      }
    }

    // precio tras regla + cargo fijo + factor de riesgo
    const priceAfterRule  = basePrice.mul(ruleFactor).add(ruleCharge);
    const finalPrice      = priceAfterRule.mul(riskFactor);
    const surcharge       = finalPrice.sub(basePrice);

    // 5. Expiración a 30 días
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // 6. Persistir simulación + respuestas en una transacción
    const simulation = await prisma.$transaction(async (tx) => {
      const sim = await tx.quoteSimulation.create({
        data: {
          dealershipId:   moto.dealershipId,
          motorcycleId:   moto.id,
          applicantName:  input.applicantName,
          applicantEmail: input.applicantEmail,
          basePrice,
          finalPrice,
          currency:       moto.currency,
          expiresAt,
        },
      });

      if (input.responses.length) {
        await tx.simulationResponse.createMany({
          data: input.responses.map(r => ({
            simulationId: sim.id,
            questionId:   r.questionId,
            optionId:     r.optionId ?? null,
            textValue:    r.textValue ?? null,
          })),
          skipDuplicates: true,
        });
      }

      return sim;
    });

    return {
      simulationId: simulation.id,
      currency:     moto.currency,
      breakdown: {
        basePrice:    basePrice.toFixed(2),
        ruleName:     rule?.name ?? null,
        ruleFactor:   ruleFactor.toFixed(4),
        ruleCharge:   ruleCharge.toFixed(2),
        riskFactor:   riskFactor.toFixed(4),
        riskDetails:  riskBreakdown,
        surcharge:    surcharge.toFixed(2),
        finalPrice:   finalPrice.toFixed(2),
      },
      expiresAt: simulation.expiresAt,
    };
  },
};
