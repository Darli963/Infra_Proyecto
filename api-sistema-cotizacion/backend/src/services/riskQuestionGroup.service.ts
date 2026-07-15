import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { riskQuestionService } from "./riskQuestion.service";

export interface NestedOptionInput {
  id?: string;
  label: string;
  riskFactor: number;
  sortOrder?: number;
}

export interface NestedQuestionInput {
  id?: string;
  text: string;
  inputType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TEXT" | "NUMBER" | "BOOLEAN";
  required: boolean;
  sortOrder: number;
  active?: boolean;
  options?: NestedOptionInput[];
}

export interface RiskQuestionGroupInput {
  name: string;
  description?: string;
  active?: boolean;
  questions?: NestedQuestionInput[];
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
        ...(input.questions?.length && {
          questions: {
            create: input.questions.map((q) => ({
              text: q.text,
              inputType: q.inputType,
              required: q.required,
              sortOrder: q.sortOrder,
              active: q.active ?? true,
              ...(q.options?.length && {
                options: {
                  create: q.options.map((o) => ({
                    label: o.label,
                    riskFactor: new Prisma.Decimal(o.riskFactor),
                    sortOrder: o.sortOrder ?? 0,
                  })),
                },
              }),
            })),
          },
        }),
      },
      include: {
        questions: {
          orderBy: { sortOrder: "asc" },
          include: { options: { orderBy: { sortOrder: "asc" } } },
        },
      },
    });
  },

  async update(id: string, input: RiskQuestionGroupInput) {
    await prisma.riskQuestionGroup.update({
      where: { id },
      data: {
        name:        input.name,
        description: input.description,
        active:      input.active,
      },
    });

    if (input.questions) {
      const existingQuestions = await prisma.riskQuestion.findMany({
        where: { groupId: id },
        include: { options: true },
      });

      const existingIds = existingQuestions.map((q) => q.id);
      const inputIds = input.questions.map((q) => q.id).filter(Boolean) as string[];

      // 1. Eliminar preguntas no presentes
      const toDelete = existingIds.filter((eid) => !inputIds.includes(eid));
      for (const qid of toDelete) {
        const responseCount = await prisma.simulationResponse.count({ where: { questionId: qid } });
        if (responseCount > 0) {
          // Si ya tiene cotizaciones, borrado lógico
          await prisma.riskQuestion.update({ where: { id: qid }, data: { active: false } });
        } else {
          // Si no, borrado físico
          await prisma.riskQuestionOption.deleteMany({ where: { questionId: qid } });
          await prisma.riskQuestion.delete({ where: { id: qid } });
        }
      }

      // 2. Upsert preguntas y opciones
      for (const q of input.questions) {
        if (q.id) {
          await prisma.riskQuestion.update({
            where: { id: q.id },
            data: {
              text:      q.text,
              inputType: q.inputType,
              required:  q.required,
              sortOrder: q.sortOrder,
              active:    q.active,
            },
          });

          if (q.options) {
            const existingOpts = await prisma.riskQuestionOption.findMany({ where: { questionId: q.id } });
            const existingOptIds = existingOpts.map((o) => o.id);
            const inputOptIds = q.options.map((o) => o.id).filter(Boolean) as string[];

            // Eliminar opciones removidas si no se usan
            const optsToDelete = existingOptIds.filter((eoid) => !inputOptIds.includes(eoid));
            for (const oid of optsToDelete) {
              const resCount = await prisma.simulationResponse.count({ where: { optionId: oid } });
              if (resCount === 0) {
                await prisma.riskQuestionOption.delete({ where: { id: oid } });
              }
            }

            // Upsert opciones
            for (const o of q.options) {
              if (o.id) {
                await prisma.riskQuestionOption.update({
                  where: { id: o.id },
                  data: {
                    label:      o.label,
                    riskFactor: new Prisma.Decimal(o.riskFactor),
                    sortOrder:  o.sortOrder ?? 0,
                  },
                });
              } else {
                await prisma.riskQuestionOption.create({
                  data: {
                    questionId: q.id,
                    label:      o.label,
                    riskFactor: new Prisma.Decimal(o.riskFactor),
                    sortOrder:  o.sortOrder ?? 0,
                  },
                });
              }
            }
          }
        } else {
          // Nueva pregunta en el grupo
          await prisma.riskQuestion.create({
            data: {
              groupId:   id,
              text:      q.text,
              inputType: q.inputType,
              required:  q.required,
              sortOrder: q.sortOrder,
              active:    q.active ?? true,
              options: {
                create: q.options?.map((o) => ({
                  label:      o.label,
                  riskFactor: new Prisma.Decimal(o.riskFactor),
                  sortOrder:  o.sortOrder ?? 0,
                })),
              },
            },
          });
        }
      }
    }

    return this.findOne(id);
  },

  async remove(id: string) {
    // Verificar si el grupo tiene motos asociadas
    const motoCount = await prisma.motorcycle.count({ where: { riskQuestionGroupId: id } });

    if (motoCount > 0) {
      // Si está en uso, desactivación lógica
      await prisma.riskQuestionGroup.update({
        where: { id },
        data: { active: false },
      });
    } else {
      // Si no, borrado completo de preguntas y grupo
      const questions = await prisma.riskQuestion.findMany({ where: { groupId: id } });
      for (const q of questions) {
        await prisma.riskQuestionOption.deleteMany({ where: { questionId: q.id } });
      }
      await prisma.riskQuestion.deleteMany({ where: { groupId: id } });
      await prisma.riskQuestionGroup.delete({ where: { id } });
    }
  },

  async addQuestion(groupId: string, questionInput: any) {
    await riskQuestionGroupService.findOne(groupId);
    return riskQuestionService.create({
      ...questionInput,
      groupId,
    });
  },
};
