import { auth } from "../auth/auth.js";
import { fromNodeHeaders } from "better-auth/node";


export async function requireAuth(
  req,
  res,
  next
) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  // Make the authenticated user and session
  // available to subsequent route handlers.
  res.locals.user = session.user;
  res.locals.session = session.session;

  next();
}
