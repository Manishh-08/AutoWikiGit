import express from 'express';
import "dotenv/config";
import cors from "cors";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import indexRoutes from "./routes/index.routes.js";
import chatRoutes from "./routes/chat.routes.js"
import { auth } from './auth/auth.js';
import { toNodeHandler } from "better-auth/node";
import { requireAuth } from './middleware/auth.middleware.js';

const port = process.env.PORT ?? 3001;

const app = express();
app.set("trust proxy", 1);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://auto-wiki-git.vercel.app",
  "http://localhost:3000",
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));

app.all('/api/auth/*splat', toNodeHandler(auth));
app.use(express.json());

app.use("/api/inngest", serve({ client: inngest, functions }));

app.get('/health', (req, res) => {
  res.send("All Working");
})

app.use('/api/index', requireAuth, indexRoutes);
app.use("/api/chat", requireAuth, chatRoutes);

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
})