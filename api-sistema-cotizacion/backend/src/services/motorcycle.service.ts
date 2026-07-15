import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";

export interface MotorcycleInput {
  brand: string;
  model: string;
  year: number;
  engineCC: number;
  price: number;
  currency?: string;
  category: string;
  description?: string;
  active?: boolean;
  riskQuestionGroupId?: string | null;
  quoteProfileId?: string | null;
  images?: { url: string; altText?: string; isPrimary?: boolean; sortOrder?: number }[];
}

export interface ListFilters {
  search?: string;   // busca en brand y model
  category?: string;
  active?: boolean;
  page?: number;
  limit?: number;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const imageInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  riskQuestionGroup: { select: { id: true, name: true } },
  quoteProfile: { select: { id: true, name: true } }
};

export const motorcycleService = {
  async list(dealershipId: string, filters: ListFilters) {
    const page  = Math.max(1, filters.page  ?? 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, filters.limit ?? DEFAULT_LIMIT));
    const skip  = (page - 1) * limit;

    const where: Prisma.MotorcycleWhereInput = {
      dealershipId,
      ...(filters.category !== undefined && { category: filters.category }),
      ...(filters.active   !== undefined && { active: filters.active }),
      ...(filters.search && {
        OR: [
          { brand: { contains: filters.search, mode: "insensitive" } },
          { model: { contains: filters.search, mode: "insensitive" } },
        ],
      }),
    };

    const [total, items] = await Promise.all([
      prisma.motorcycle.count({ where }),
      prisma.motorcycle.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, include: imageInclude }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  },

  async findOwned(id: string, dealershipId: string) {
    const moto = await prisma.motorcycle.findUnique({ where: { id }, include: imageInclude });
    if (!moto)
      throw Object.assign(new Error("Motocicleta no encontrada"), { status: 404 });
    if (moto.dealershipId !== dealershipId)
      throw Object.assign(new Error("Sin acceso"), { status: 403 });
    return moto;
  },

  async create(dealershipId: string, input: MotorcycleInput) {
    const { images, price, ...rest } = input;
    return prisma.motorcycle.create({
      data: {
        ...rest,
        price: new Prisma.Decimal(price),
        dealershipId,
        ...(images?.length && { images: { create: images } }),
      },
      include: imageInclude,
    });
  },

  async update(id: string, dealershipId: string, input: Partial<MotorcycleInput>) {
    await motorcycleService.findOwned(id, dealershipId);
    const { images, price, ...rest } = input;
    return prisma.motorcycle.update({
      where: { id },
      data: {
        ...rest,
        ...(price !== undefined && { price: new Prisma.Decimal(price) }),
        ...(images !== undefined && { images: { deleteMany: {}, create: images } }),
      },
      include: imageInclude,
    });
  },

  async remove(id: string, dealershipId: string) {
    await motorcycleService.findOwned(id, dealershipId);

    // Verificar si existen cotizaciones asociadas a esta motocicleta
    const quotesCount = await prisma.quoteSimulation.count({
      where: { motorcycleId: id },
    });

    if (quotesCount > 0) {
      // Si hay cotizaciones, realizamos un borrado lógico (desactivar)
      await prisma.motorcycle.update({
        where: { id },
        data: { active: false },
      });
    } else {
      // Si no hay cotizaciones, la eliminamos físicamente de la base de datos
      await prisma.motorcycle.delete({
        where: { id },
      });
    }
  },
};
