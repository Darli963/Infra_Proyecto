import prisma from "../config/prisma";
import { riskQuestionService, RiskQuestionInput } from "./riskQuestion.service";

export interface RiskQuestionGroupInput {
  name: string;
  description?: string;
  active?: boolean;
}

export const riskQuestionGroupService = {
  async list() {
    return prisma.riskQuestionGroup.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      include: {
        questions: {
          orderBy: { sortOrder: "asc" },
          include: { options: { orderBy: { sortOrder: "asc" } } },
        },
      },
    });
  },

  async findOne(id: string) {
    const group = await prisma.riskQuestionGroup.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { sortOrder: "asc" },
          include: { options: { orderBy: { sortOrder: "asc" } } },
        },
      },
    });
    if (!group) throw Object.assign(new Error("Grupo no encontrado"), { status: 404 });
    return group;
  },

  async create(input: RiskQuestionGroupInput) {
    return prisma.riskQuestionGroup.create({
      data: {
        name:        input.name,
        description: input.description,
        active:      input.active ?? true,
      },
    });
  },

  async addQuestion(groupId: string, questionInput: RiskQuestionInput) {
    // Verifica que el grupo exista
    await riskQuestionGroupService.findOne(groupId);

    // Crea la pregunta forzando el groupId
    return riskQuestionService.create({
      ...questionInput,
      groupId,
    });
  },
};
