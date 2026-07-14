import { Router, Request, Response, NextFunction } from "express";
import { publicController } from "../controllers/public.controller";
import { validate } from "../utils/validate";
import { loadSimulationForPdf, buildQuotePdf } from "../services/pdf.service";

const router = Router();

router.get("/motorcycles",      publicController.listMotorcycles);
router.get("/motorcycles/:id",  publicController.getMotorcycle);
router.get("/dealerships",      publicController.listDealerships);
router.get("/risk-questions",   publicController.getRiskQuestions);

router.post(
  "/quote/simulate",
  validate({
    motorcycleId:   { required: true },
    applicantName:  { required: true },
    applicantEmail: { required: true, isEmail: true },
    responses:      { required: true },
  }),
  publicController.simulate
);

router.get("/quote/:simulationId/pdf", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sim = await loadSimulationForPdf(req.params.simulationId);
    const filename = `cotizacion-${sim.id.slice(0, 8)}.pdf`;

    res.setHeader("Content-Type",        "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const stream = buildQuotePdf(sim);
    stream.pipe(res);
    stream.on("error", next);
  } catch (err) {
    next(err);
  }
});

export default router;
