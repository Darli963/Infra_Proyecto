import express from "express";
import { requestLogger } from "./middlewares/logger.middleware";
import healthRouter       from "./routes/health.routes";
import authRouter         from "./routes/auth.routes";
import motorcycleRouter   from "./routes/motorcycle.routes";
import publicRouter       from "./routes/public.routes";
import quoteProfileRouter from "./routes/quoteProfile.routes";
import riskQuestionRouter from "./routes/riskQuestion.routes";
import riskQuestionGroupRouter from "./routes/riskQuestionGroup.routes";
import { errorHandler }   from "./middlewares/error.middleware";

const app = express();
app.use(express.json());
app.use(requestLogger);

app.use("/api",                      healthRouter);
app.use("/api/auth",                 authRouter);
app.use("/api/dealer/motorcycles",   motorcycleRouter);
app.use("/api/dealer/quote-rules",   quoteProfileRouter);
app.use("/api/dealer/quote-profiles",quoteProfileRouter);
app.use("/api/dealer/risk-questions",riskQuestionRouter);
app.use("/api/dealer/risk-question-groups", riskQuestionGroupRouter);
app.use("/api/public",               publicRouter);

app.use(errorHandler);
export default app;
