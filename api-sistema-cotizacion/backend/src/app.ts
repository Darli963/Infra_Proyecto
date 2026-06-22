import express from "express";
import healthRouter     from "./routes/health.routes";
import authRouter       from "./routes/auth.routes";
import motorcycleRouter from "./routes/motorcycle.routes";
import publicRouter     from "./routes/public.routes";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

app.use(express.json());

app.use("/api",                    healthRouter);
app.use("/api/auth",               authRouter);
app.use("/api/dealer/motorcycles", motorcycleRouter);
app.use("/api/public",             publicRouter);

app.use(errorHandler);

export default app;
