import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';

/**
 * Generic Zod validation middleware.
 * Validates req.body, req.query, and req.params against the provided schema.
 * On success, replaces req.body with the parsed (and coerced) data.
 * Note: req.query and req.params are read-only in Express v5, so we
 * only reassign req.body which is the primary mutation target.
 */
export const validate = (schema: ZodObject<any, any>) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    // Only reassign body (query & params are read-only getters in Express v5)
    if (parsed.body) {
      req.body = parsed.body;
    }
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.issues.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    return next(error);
  }
};
