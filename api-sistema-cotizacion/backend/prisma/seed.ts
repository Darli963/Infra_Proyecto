import { PrismaClient, InputType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Concesionaria de ejemplo
  const dealership = await prisma.dealership.upsert({
    where: { slug: "moto-demo" },
    update: {},
    create: {
      name: "Moto Demo S.A.",
      slug: "moto-demo",
      email: "contacto@motodemo.com",
      phone: "+1-555-0100",
    },
  });

  // Preguntas de riesgo base
  const q1 = await prisma.riskQuestion.upsert({
    where: { id: "rq-001" },
    update: {},
    create: {
      id: "rq-001",
      text: "¿Para qué usará la motocicleta principalmente?",
      inputType: InputType.SINGLE_CHOICE,
      sortOrder: 1,
      options: {
        create: [
          { label: "Uso personal / recreativo", riskFactor: 1.0, sortOrder: 1 },
          { label: "Transporte urbano diario",  riskFactor: 1.1, sortOrder: 2 },
          { label: "Trabajo / reparto",         riskFactor: 1.3, sortOrder: 3 },
        ],
      },
    },
  });

  const q2 = await prisma.riskQuestion.upsert({
    where: { id: "rq-002" },
    update: {},
    create: {
      id: "rq-002",
      text: "¿Cuántos años de experiencia tiene conduciendo motocicletas?",
      inputType: InputType.NUMBER,
      sortOrder: 2,
    },
  });

  console.log("Seed completado:", { dealership: dealership.slug, q1: q1.id, q2: q2.id });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
