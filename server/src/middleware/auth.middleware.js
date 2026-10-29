import { auth } from "../auth/auth.js";
import { fromNodeHeaders } from "better-auth/node";

export async function requireAuth(req, res, next) {
  // If user passed a personal access token directly, allow request with token context
  const customToken = req.headers["x-github-token"] || req.body?.token;
  if (customToken) {
    res.locals.user = { id: "pat-user", name: "GitHub Token User" };
    res.locals.session = { id: "pat-session" };
    return next();
  }

  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    return res.status(401).json({
      message: "Unauthorized - Please sign in with GitHub or provide a GitHub token",
    });
  }

  res.locals.user = session.user;
  res.locals.session = session.session;

  next();
}
