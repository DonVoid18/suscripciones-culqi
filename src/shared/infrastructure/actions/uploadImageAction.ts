"use server";

import { S3FileRepository } from "@/shared/infrastructure/repository/S3FileRepository";
import { FileService } from "@/shared/infrastructure/services/S3FileService";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB en bytes
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

interface UploadImageResult {
  success: boolean;
  data?: {
    id: string;
    key: string;
    fileName: string;
    url: string;
    mimeType: string;
    size: number;
  };
  error?: string;
}

export async function uploadImageAction(
  formData: FormData
): Promise<UploadImageResult> {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      return {
        success: false,
        error: "No se proporcionó ninguna imagen",
      };
    }

    // Validar que sea un archivo válido
    if (file.size === 0) {
      return {
        success: false,
        error: "La imagen está vacía",
      };
    }

    // Validar tamaño de la imagen
    if (file.size > MAX_IMAGE_SIZE) {
      return {
        success: false,
        error: `La imagen excede el tamaño máximo permitido de 5MB. Tamaño actual: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      };
    }

    // Validar tipo MIME
    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.type as (typeof ALLOWED_IMAGE_TYPES)[number]
      )
    ) {
      return {
        success: false,
        error: `Tipo de imagen no permitido. Solo se aceptan: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
      };
    }

    // Validar extensión del archivo
    const fileExtension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (!fileExtension || !ALLOWED_IMAGE_EXTENSIONS.includes(fileExtension)) {
      return {
        success: false,
        error: `Extensión de archivo no válida. Solo se aceptan: ${ALLOWED_IMAGE_EXTENSIONS.join(", ")}`,
      };
    }

    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validar que el buffer contenga datos de imagen válidos (magic numbers)
    if (!isValidImageBuffer(buffer, file.type)) {
      return {
        success: false,
        error: "El archivo no parece ser una imagen válida",
      };
    }

    // Obtener el folder opcional del FormData
    const folder = formData.get("folder") as string | null;

    // Inicializar el servicio de archivos
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const region = process.env.AWS_REGION || "us-east-1";

    if (!bucketName) {
      return {
        success: false,
        error: "Configuración de S3 incompleta. Falta AWS_S3_BUCKET_NAME",
      };
    }

    const fileRepository = new S3FileRepository(bucketName, region);
    const fileService = new FileService(fileRepository);

    // Subir la imagen
    const metadata = await fileService.uploadFile({
      file: buffer,
      fileName: file.name,
      mimeType: file.type,
      folder: folder || "images",
    });

    // Obtener URL firmada para acceder a la imagen
    const url = await fileService.getDownloadUrl(metadata.key, 3600); // válida por 1 hora

    return {
      success: true,
      data: {
        id: metadata.id,
        key: metadata.key,
        fileName: metadata.fileName,
        url,
        mimeType: file.type,
        size: file.size,
      },
    };
  } catch (error) {
    console.error("Error al subir imagen:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al subir la imagen",
    };
  }
}

/**
 * Valida que el buffer contenga magic numbers válidos de imagen
 */
function isValidImageBuffer(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false;

  // JPEG: FF D8 FF
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (mimeType === "image/png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }

  // GIF: 47 49 46 38
  if (mimeType === "image/gif") {
    return (
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38
    );
  }

  // WEBP: 52 49 46 46 ... 57 45 42 50
  if (mimeType === "image/webp") {
    return (
      buffer.length >= 12 &&
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    );
  }

  return false;
}
