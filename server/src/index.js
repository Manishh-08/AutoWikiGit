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
const frontendOrigin = process.env.FRONTEND_URL ?? "http://localhost:3000";

const app = express();

app.use(cors({
  origin: frontendOrigin,
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