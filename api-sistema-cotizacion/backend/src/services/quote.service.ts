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
  riskQuestionGroupId: true,
  quoteProfileId: true,
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

  async getRiskQuestions(filters: { motorcycleId?: string; groupId?: string } = {}) {
    if (filters.motorcycleId) {
      const moto = await prisma.motorcycle.findUnique({ where: { id: filters.motorcycleId } });
      if (!moto) throw Object.assign(new Error("Motocicleta no encontrada"), { status: 404 });
      if (!moto.riskQuestionGroupId) {
        throw Object.assign(new Error("Esta motocicleta no tiene un grupo de preguntas de riesgo asignado"), { status: 400 });
      }
      return prisma.riskQuestion.findMany({
        where: { active: true, groupId: moto.riskQuestionGroupId },
        orderBy: { sortOrder: "asc" },
        include: { options: { orderBy: { sortOrder: "asc" } } },
      });
    }

    if (filters.groupId) {
      return prisma.riskQuestion.findMany({
        where: { active: true, groupId: filters.groupId },
        orderBy: { sortOrder: "asc" },
        include: { options: { orderBy: { sortOrder: "asc" } } },
      });
    }

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
    // 1. Cargar moto con su concesionaria, perfil y grupo de preguntas
    const moto = await prisma.motorcycle.findFirst({
      where: { id: input.motorcycleId, active: true },
      include: { dealership: true, quoteProfile: true, riskQuestionGroup: true },
    });
    if (!moto) throw Object.assign(new Error("Motocicleta no disponible"), { status: 404 });
    if (!moto.dealership.active) throw Object.assign(new Error("Concesionaria inactiva"), { status: 404 });

    // Validar asignaciones obligatorias
    if (!moto.riskQuestionGroupId) {
      throw Object.assign(new Error("Esta motocicleta no tiene un grupo de preguntas de riesgo asignado"), { status: 400 });
    }
    if (!moto.quoteProfileId) {
      throw Object.assign(new Error("Esta motocicleta no tiene un perfil de cotización asignado"), { status: 400 });
    }

    const profile = moto.quoteProfile;
    if (!profile?.active) {
      throw Object.assign(new Error("El perfil de cotización vinculado no está activo o no existe"), { status: 400 });
    }

    // 3. Resolver factores de riesgo de las respuestas con opción seleccionada
    const optionIds = input.responses.flatMap(r => r.optionId ? [r.optionId] : []);
    const options = optionIds.length
      ? await prisma.riskQuestionOption.findMany({ where: { id: { in: optionIds } } })
      : [];

    const optionMap = new Map(options.map(o => [o.id, o]));

    // 4. Cálculo aritmético en JS con Decimal para evitar errores de punto flotante
    const basePrice   = new Prisma.Decimal(moto.price);
    const ruleFactor  = new Prisma.Decimal(profile.factor);
    const ruleCharge  = new Prisma.Decimal(profile.fixedCharge);

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
        basePrice:      basePrice.toFixed(2),
        profileName:    profile.name,
        profileFactor:  ruleFactor.toFixed(4),
        profileCharge:  ruleCharge.toFixed(2),
        minDownPayment: new Prisma.Decimal(profile.minDownPayment).toFixed(2),
        maxMonths:      profile.maxMonths,
        riskFactor:     riskFactor.toFixed(4),
        riskDetails:    riskBreakdown,
        surcharge:      surcharge.toFixed(2),
        finalPrice:     finalPrice.toFixed(2),
      },
      expiresAt: simulation.expiresAt,
    };
  },
};
