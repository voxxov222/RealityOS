import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";

const app: Express = express();
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
const isDev = process.env.NODE_ENV !== "production";
app.use(
  cors({
    credentials: true,
    origin: isDev
      ? true
      : (origin, cb) => {
          if (!origin) return cb(null, true);
          const allowed =
            /\.replit\.app$/.test(origin) ||
            /\.replit\.dev$/.test(origin) ||
            (process.env.ALLOWED_ORIGINS ?? "")
              .split(",")
              .map((o) => o.trim())
              .includes(origin);
          cb(allowed ? null : new Error("CORS policy violation"), allowed);
        },
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

app.use("/api", router);

export default app;
