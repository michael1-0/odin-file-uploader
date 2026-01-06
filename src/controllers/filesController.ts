import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db/prisma.ts";
import multerUtil from "../util/multer.ts";
import cloudinary from "../util/cloudinary.ts";
import multer from "multer";

function getFileForm(req: Request, res: Response) {
  if (req.isUnauthenticated()) {
    return res.redirect("/");
  }
  const previousUrl = req.get("Referer") || "/";
  res.render("files.ejs", {
    folderId: req.query.containingFolder,
    previousUrl: previousUrl,
    error: null,
  });
}

async function postFile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new Error("No file uploaded");
    }
    const result = await multerUtil.uploadToCloudinary(req.file);

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
    if (!file) {
      throw new Error("File not found");
    }
    const downloadUrl = cloudinary.url(file.publicId, {
      flags: "attachment",
      resource_type: "image",
      type: "private",
    });
    res.render("file-detail", {
      file: file,
      previousUrl: previousUrl,
      downloadUrl: downloadUrl,
    });
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

const handleMulterError = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const previousUrl = req.body.previousUrl || req.get("Referer") || "/";

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.render("files.ejs", {
        folderId: req.query.containingFolder,
        previousUrl: previousUrl,
        error: "File size exceeds 10MB limit",
      });
    }
    return res.render("files.ejs", {
      folderId: req.query.containingFolder,
      previousUrl: previousUrl,
      error: `Upload error: ${err.message}`,
    });
  } else if (err) {
    if (err.message === "Invalid file type") {
      return res.render("files.ejs", {
        folderId: req.query.containingFolder,
        previousUrl: previousUrl,
        error:
          "Invalid file type. Only JPEG, JPG, PNG, and GIF images are allowed.",
      });
    }
    return res.render("files.ejs", {
      folderId: req.query.containingFolder,
      previousUrl: previousUrl,
      error: err.message || "Upload failed",
    });
  }
  next();
};

const postFilePipeline = [
  (req: Request, res: Response, next: NextFunction) => {
    if (req.isUnauthenticated()) {
      return res.redirect("/");
    }
    next();
  },
  multerUtil.upload.single("userFile"),
  handleMulterError,
  postFile,
];

export { getFileForm, postFilePipeline, getFileById, deleteFileById };
