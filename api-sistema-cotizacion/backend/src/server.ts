import app from "./app";
import { config } from "./config/env";

app.listen(config.port, "0.0.0.0", () => {
  console.log(`[server] running on http://0.0.0.0:${config.port}`);
});
