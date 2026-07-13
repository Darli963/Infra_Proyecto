import { InputType, Prisma } from "@prisma/client";
import prisma from "../config/prisma";

export interface OptionInput {
  id?: string;
  label: string;
  riskFactor?: number;
  sortOrder?: number;
}

export interface RiskQuestionInput {
  text: string;
  inputType?: InputType;
  required?: boolean;
  sortOrder?: number;
  active?: boolean;
  groupId?: string | null;
  options?: OptionInput[];
}

export const riskQuestionService = {
  list() {
    return prisma.riskQuestion.findMany({
      orderBy: { sortOrder: "asc" },
      include: { options: { orderBy: { sortOrder: "asc" } }, group: { select: { id: true, name: true } } },
    });
  },

  async findOne(id: string) {
    const q = await prisma.riskQuestion.findUnique({
      where: { id },
      include: { options: { orderBy: { sortOrder: "asc" } }, group: { select: { id: true, name: true } } },
    });
    if (!q) throw Object.assign(new Error("Pregunta no encontrada"), { status: 404 });
    return q;
  },

  async create(input: RiskQuestionInput) {
    const { options, ...data } = input;
    return prisma.riskQuestion.create({
      data: {
        ...data,
        groupId: data.groupId ?? null,
        ...(options?.length && {
          options: {
            create: options.map((o, i) => ({
              label:      o.label,
              riskFactor: new Prisma.Decimal(o.riskFactor ?? 1),
              sortOrder:  o.sortOrder ?? i,
            })),
          },
        }),
      },
      include: { options: { orderBy: { sortOrder: "asc" } } },
    });
  },

  async update(id: string, input: Partial<RiskQuestionInput>) {
    await riskQuestionService.findOne(id);
    const { options, ...data } = input;
    return prisma.riskQuestion.update({
      where: { id },
      data: {
        ...data,
        ...(options !== undefined && {
          options: {
            deleteMany: {},
            create: options.map((o, i) => ({
              label:      o.label,
              riskFactor: new Prisma.Decimal(o.riskFactor ?? 1),
              sortOrder:  o.sortOrder ?? i,
            })),
          },
        }),
      },
      include: { options: { orderBy: { sortOrder: "asc" } } },
    });
  },

  async remove(id: string) {
    await riskQuestionService.findOne(id);
    await prisma.riskQuestion.delete({ where: { id } });
  },
};
