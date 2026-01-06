import type { FileFilterCallback } from "multer";
import type { Request } from "express";

import multer from "multer";
import { Readable } from "node:stream";
import cloudinary from "./cloudinary.ts";

const acceptedMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/JPG",
];
const checkFile = (file: Express.Multer.File, cb: FileFilterCallback) => {
  if (!acceptedMimeTypes.includes(file.mimetype)) {
    cb(new Error("Invalid file type"));
    return;
  }
  cb(null, true);
};
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    checkFile(file, cb);
  },
  limits: { fileSize: 10485760 }, // 10 mb
});
const uploadToCloudinary = (
  file: Express.Multer.File
): Promise<{ publicId: string; imageUrl: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "auto", type: "private" },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          publicId: result!.public_id,
          imageUrl: result!.secure_url,
        });
      }
    );
    const readableStream = new Readable();
    readableStream.push(file.buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

export default { upload, uploadToCloudinary };
