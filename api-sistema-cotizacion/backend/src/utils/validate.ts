import { Request, Response, NextFunction } from "express";

type Rule = { required?: boolean; minLength?: number; isEmail?: boolean };
type Schema = Record<string, Rule>;

export function validate(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value: unknown = (req.body as Record<string, unknown>)[field];

      if (rules.required && (value === undefined || value === null || value === "")) {
        errors.push(`${field} es requerido`);
        continue;
      }

      if (value && rules.minLength && String(value).length < rules.minLength) {
        errors.push(`${field} debe tener al menos ${rules.minLength} caracteres`);
      }

      if (value && rules.isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
        errors.push(`${field} no es un email válido`);
      }
    }

    if (errors.length > 0) {
      res.status(400).json({ status: "error", errors });
      return;
    }

    next();
  };
}
