import type { Request, Response, NextFunction } from "express";

function currentUserHandler(req: Request, res: Response, next: NextFunction) {
  res.locals.currentUser = req.user;
  next();
}

export { currentUserHandler };
