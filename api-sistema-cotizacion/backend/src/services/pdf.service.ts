import PDFDocument from "pdfkit";
import { Readable, PassThrough } from "stream";
import prisma, { Decimal } from "../config/prisma";

// ─── carga de datos ───────────────────────────────────────────────────────────

export async function loadSimulationForPdf(simulationId: string) {
  const sim = await prisma.quoteSimulation.findUnique({
    where: { id: simulationId },
    include: {
      motorcycle: {
        include: { images: { where: { isPrimary: true }, take: 1 } },
      },
      dealership: true,
      responses: {
        include: {
          question: true,
          option:   true,
        },
      },
    },
  });
  if (!sim) throw Object.assign(new Error("Cotización no encontrada"), { status: 404 });
  return sim;
}

type SimData = Awaited<ReturnType<typeof loadSimulationForPdf>>;

// ─── helpers ─────────────────────────────────────────────────────────────────

function money(amount: string | number | Decimal, currency: string) {
  const num = amount instanceof Decimal ? amount.toNumber() : Number(amount);
  return `${currency} ${num.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
}

function fmt(date: Date | null) {
  if (!date) return "—";
  return date.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
}

// ─── colores / constantes ─────────────────────────────────────────────────────

const BLUE   = "#1D4ED8";
const GRAY   = "#6B7280";
const DARK   = "#111827";
const LIGHT  = "#F3F4F6";
const ACCENT = "#DBEAFE";

// ─── builder ─────────────────────────────────────────────────────────────────

export function buildQuotePdf(sim: SimData): Readable {
  const doc = new PDFDocument({ size: "A4", margin: 50, compress: true });

  const { motorcycle: moto, dealership } = sim;
  const currency = sim.currency;

  // ── Encabezado azul ───────────────────────────────────────────────────────
  doc.rect(0, 0, doc.page.width, 110).fill(BLUE);

  doc.fillColor("white")
     .fontSize(22).font("Helvetica-Bold")
     .text("COTIZACIÓN DE MOTOCICLETA", 50, 30);

  doc.fontSize(10).font("Helvetica")
     .text(dealership.name, 50, 58)
     .text(dealership.email, 50, 72);

  // Número de cotización (esquina superior derecha)
  doc.fontSize(9).font("Helvetica-Bold")
     .text("N° COTIZACIÓN", doc.page.width - 200, 30, { width: 150, align: "right" })
     .font("Helvetica").fontSize(8)
     .text(sim.id.toUpperCase().slice(0, 13), doc.page.width - 200, 43, { width: 150, align: "right" });

  doc.fillColor(DARK);

  let y = 130;

  // ── Motocicleta ───────────────────────────────────────────────────────────
  doc.rect(50, y, doc.page.width - 100, 22).fill(ACCENT);
  doc.fillColor(BLUE).fontSize(11).font("Helvetica-Bold")
     .text("MOTOCICLETA", 58, y + 5);
  doc.fillColor(DARK);

  y += 30;
  const motoLines: [string, string][] = [
    ["Marca",        moto.brand],
    ["Modelo",       moto.model],
    ["Año",          String(moto.year)],
    ["Cilindraje",   `${moto.engineCC} cc`],
    ["Categoría",    moto.category],
    ["Precio base",  money(sim.basePrice, currency)],
  ];
  for (const [label, value] of motoLines) {
    doc.fontSize(9).font("Helvetica-Bold").fillColor(GRAY).text(label, 58, y, { continued: true });
    doc.font("Helvetica").fillColor(DARK).text(`   ${value}`);
    y += 16;
  }

  y += 10;

  // ── Solicitante ───────────────────────────────────────────────────────────
  doc.rect(50, y, doc.page.width - 100, 22).fill(ACCENT);
  doc.fillColor(BLUE).fontSize(11).font("Helvetica-Bold")
     .text("SOLICITANTE", 58, y + 5);
  doc.fillColor(DARK);

  y += 30;
  const applicantLines: [string, string][] = [
    ["Nombre",  sim.applicantName],
    ["Correo",  sim.applicantEmail],
    ["Fecha",   fmt(sim.createdAt)],
  ];
  for (const [label, value] of applicantLines) {
    doc.fontSize(9).font("Helvetica-Bold").fillColor(GRAY).text(label, 58, y, { continued: true });
    doc.font("Helvetica").fillColor(DARK).text(`   ${value}`);
    y += 16;
  }

  y += 10;

  // ── Respuestas del cuestionario ───────────────────────────────────────────
  if (sim.responses.length > 0) {
    doc.rect(50, y, doc.page.width - 100, 22).fill(ACCENT);
    doc.fillColor(BLUE).fontSize(11).font("Helvetica-Bold")
       .text("CUESTIONARIO DE RIESGO", 58, y + 5);
    doc.fillColor(DARK);
    y += 30;

    for (const resp of sim.responses) {
      const answer = resp.option?.label ?? resp.textValue ?? "—";
      doc.fontSize(9).font("Helvetica-Bold").fillColor(GRAY)
         .text(resp.question.text, 58, y, { continued: true });
      doc.font("Helvetica").fillColor(DARK).text(`   ${answer}`);
      y += 16;
      if (y > doc.page.height - 150) { doc.addPage(); y = 50; }
    }
    y += 10;
  }

  // ── Desglose de precio ────────────────────────────────────────────────────
  doc.rect(50, y, doc.page.width - 100, 22).fill(ACCENT);
  doc.fillColor(BLUE).fontSize(11).font("Helvetica-Bold")
     .text("DESGLOSE", 58, y + 5);
  doc.fillColor(DARK);

  y += 30;
  const basePrice  = Number(sim.basePrice);
  const finalPrice = Number(sim.finalPrice);
  const surcharge  = finalPrice - basePrice;

  const breakdown: [string, string][] = [
    ["Precio base",     money(basePrice,  currency)],
    ["Recargos totales",money(surcharge,  currency)],
  ];
  for (const [label, value] of breakdown) {
    doc.fontSize(9).font("Helvetica-Bold").fillColor(GRAY).text(label, 58, y, { continued: true });
    doc.font("Helvetica").fillColor(DARK).text(`   ${value}`);
    y += 16;
  }

  // Precio final destacado
  y += 6;
  doc.rect(50, y, doc.page.width - 100, 30).fill(BLUE);
  doc.fillColor("white").fontSize(13).font("Helvetica-Bold")
     .text("PRECIO FINAL", 58, y + 8, { continued: true })
     .text(`   ${money(finalPrice, currency)}`, { align: "right" });
  doc.fillColor(DARK);

  y += 44;

  // ── Vencimiento ───────────────────────────────────────────────────────────
  doc.rect(50, y, doc.page.width - 100, 28).fill(LIGHT);
  doc.fillColor(GRAY).fontSize(9).font("Helvetica")
     .text(`Esta cotización es válida hasta el ${fmt(sim.expiresAt)}.`, 58, y + 8);

  // ── Pie de página ─────────────────────────────────────────────────────────
  doc.rect(0, doc.page.height - 40, doc.page.width, 40).fill(BLUE);
  doc.fillColor("white").fontSize(8).font("Helvetica")
     .text(
       `Generado el ${fmt(new Date())} · ${dealership.name} · ${dealership.email}`,
       50, doc.page.height - 26, { align: "center", width: doc.page.width - 100 }
     );

  doc.end();

  // Convierte el PDFDocument (stream de escritura) en un Readable
  const pass = new PassThrough();
  doc.pipe(pass);
  return pass;
}
