import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db/prisma.ts";
import multer from "../util/multer.ts";
import cloudinary from "../util/cloudinary.ts";

function getFileForm(req: Request, res: Response) {
  if (req.isUnauthenticated()) {
    return res.redirect("/");
  }
  const previousUrl = req.get("Referer") || "/";
  res.render("files.ejs", {
    folderId: req.query.containingFolder,
    previousUrl: previousUrl,
  });
}

async function postFile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new Error("No file uploaded");
    }
    const result = await multer.uploadToCloudinary(req.file);

    await prisma.files.create({
      data: {
        publicId: result.publicId,
        name: req.file.originalname,
        fileType: req.file.mimetype,
        uploadDate: new Date().toISOString(),
        userId: (req.user as any).id,
        size: String(req.file.size),
        folderId:
          req.query.containingFolder !== "-1"
            ? Number(req.query.containingFolder)
            : null,
      },
    });

    const redirectUrl =
      req.query.containingFolder !== "-1"
        ? "/folders/" + req.query.containingFolder
        : "/";
    res.redirect(redirectUrl);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Upload failed", error });
  }
}

async function getFileById(req: Request, res: Response, next: NextFunction) {
  if (req.isUnauthenticated()) {
    return res.redirect("/");
  }
  const previousUrl = req.get("Referer") || "/";
  const fileId = Number(req.params.id);
  const containingFolderId = Number(req.query.containingFolder);
  try {
    const file = await prisma.files.findUnique({
      where: {
        id: fileId,
        userId: (req.user as any).id,
        folderId: containingFolderId,
      },
    });
    res.render("file-detail", { file: file, previousUrl: previousUrl });
  } catch (error) {
    next(error);
  }
}

async function deleteFileById(req: Request, res: Response, next: NextFunction) {
  if (req.isUnauthenticated()) {
    return res.redirect("/");
  }
  const fileId = Number(req.params.id);
  try {
    const file = await prisma.files.findUnique({
      where: {
        id: fileId,
        userId: (req.user as any).id,
      },
    });
    if (!file) {
      throw new Error("File not found");
    }
    const deleteFileOnCloudinary = await cloudinary.uploader.destroy(
      file.publicId,
      {
        type: "private",
      }
    );
    if (deleteFileOnCloudinary.result === "ok") {
      await prisma.files.delete({ where: { id: file.id } });
      const redirectUrl = file.folderId ? "/folders/" + file.folderId : "/";
      res.redirect(redirectUrl);
    } else {
      res.status(400).json({ message: "Failed to delete file" });
    }
  } catch (error) {
    next(error);
  }
}

async function downloadFile(req: Request, res: Response, next: NextFunction) {
  // todo
  // const url = cloudinary.url(publicId, {
  // flags: 'attachment',
  // resource_type: 'auto'
  // });
}

const postFilePipeline = [
  (req: Request, res: Response, next: NextFunction) => {
    if (req.isUnauthenticated()) {
      return res.redirect("/");
    }
    next();
  },
  multer.upload.single("userFile"),
  postFile,
];

export {
  getFileForm,
  postFilePipeline,
  getFileById,
  deleteFileById,
  downloadFile,
};
