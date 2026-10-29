import express from 'express';
import "dotenv/config";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import indexRoutes from "./routes/index.routes.js";
// import chatRoutes from "./routes/chat.routes.js"

const port = process.env.PORT ?? 3000;

const app = express();

app.use(express.json());

app.use("/api/inngest", serve({ client: inngest, functions }));

app.get('/health', (req, res) => {
  res.send("All Working");
})

app.use('/api/index',indexRoutes)
app.listen(port, () => {
  console.log("server is running on port 3000");
})