import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Расширяем типы для Express роутов
declare module 'express-serve-static-core' {
  interface RequestHandler {
    (req: Request, res: Response, next: NextFunction): void | Promise<void> | Response | Promise<Response>;
  }
}

export {}; 