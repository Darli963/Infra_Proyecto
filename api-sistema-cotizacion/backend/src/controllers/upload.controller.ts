import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { uploadImage } from "../config/storage.service";
import prisma from "../config/prisma";

// Almacena en memoria — el buffer se pasa directamente a S3
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype.startsWith("image/"));
  },
});

export const uploadMiddleware = upload.single("image");

export async function uploadImageHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw Object.assign(new Error("No se recibió ningún archivo"), { status: 400 });

    const { motorcycleId, altText, isPrimary } = req.body as Record<string, string>;

    if (motorcycleId) {
      // Verifica que la moto pertenezca a la concesionaria autenticada
      const moto = await prisma.motorcycle.findUnique({ where: { id: motorcycleId } });
      if (!moto) throw Object.assign(new Error("Motocicleta no encontrada"), { status: 404 });
      if (moto.dealershipId !== req.dealership!.sub)
        throw Object.assign(new Error("Sin acceso"), { status: 403 });
    }

    const url = await uploadImage(req.file.buffer, req.file.mimetype);

    // Si se proporcionó motorcycleId, persiste la imagen directamente
    if (motorcycleId) {
      const image = await prisma.motorcycleImage.create({
        data: {
          motorcycleId,
          url,
          altText:   altText   ?? null,
          isPrimary: isPrimary === "true",
        },
      });
      return res.status(201).json({ status: "ok", data: image });
    }

    // Sin motorcycleId devuelve solo la URL para que el cliente la use en el formulario
    res.status(200).json({ status: "ok", data: { url } });
  } catch (err) {
    next(err);
  }
}
