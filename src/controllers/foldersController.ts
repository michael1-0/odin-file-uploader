import type { Response, Request, NextFunction } from "express";
import { prisma } from "../db/prisma.ts";
import cloudinary from "../util/cloudinary.ts";
import { getBreadcrumbs } from "../util/breadcrumb.ts";

function getFolderForm(req: Request, res: Response) {
  if (req.isUnauthenticated()) {
    return res.redirect("/log-in");
  }
  res.render("folders", { folderId: null });
}

async function postFolder(req: Request, res: Response, next: NextFunction) {
  if (req.isUnauthenticated()) {
    return res.redirect("/log-in");
  }
  const user: any = req.user;
  const folderName = req.body.name;
  try {
    await prisma.folder.create({
      data: {
        name: folderName,
        userId: user.id,
      },
    });
    res.redirect("/");
  } catch (err) {
    next(err);
  }
}

async function getFolderById(req: Request, res: Response, next: NextFunction) {
  if (req.isUnauthenticated()) {
    return res.redirect("/log-in");
  }
  const folderId = Number(req.params.id);
  try {
    const parentFolder = await prisma.folder.findUnique({
      where: {
        id: folderId,
        userId: (req.user as any).id,
      },
    });

    if (!parentFolder) {
      return res.redirect("/");
    }

    const folders = await prisma.folder.findMany({
      where: {
        parentId: folderId,
        userId: (req.user as any).id,
      },
    });

    const files = await prisma.files.findMany({
      where: {
        folderId: folderId,
        userId: (req.user as any).id,
      },
    });

    const breadcrumbs = await getBreadcrumbs(folderId, (req.user as any).id);
    res.render("home", {
      folders: folders,
      title: parentFolder.name,
      folderId: folderId,
      files: files,
      breadcrumbs: breadcrumbs,
    });
  } catch (err) {
    next(err);
  }
}

function getFolderFormWithId(req: Request, res: Response) {
  if (req.isUnauthenticated()) {
    return res.redirect("/log-in");
  }
  const folderId = req.params.id;
  const previousUrl = req.get("Referer") || "/";
  res.render("folders", { folderId, previousUrl: previousUrl });
}

async function postFolderWithId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.isUnauthenticated()) {
    return res.redirect("/log-in");
  }
  const user: any = req.user;
  const folderName = req.body.name;
  const folderId = Number(req.params.id);
  try {
    const folder = await prisma.folder.create({
      data: {
        name: folderName,
        userId: user.id,
        parentId: folderId,
      },
    });
    res.redirect(`/folders/${folder.id}`);
  } catch (err) {
    next(err);
  }
}

async function deleteFolderById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.isUnauthenticated()) {
    return res.redirect("/log-in");
  }
  const folderId = Number(req.params.id);
  try {
    // wtf
    const getAllFilesInFolder = async (folderId: number) => {
      const files = await prisma.files.findMany({
        where: { folderId, userId: (req.user as any).id },
        select: { id: true, publicId: true, fileType: true },
      });

      const childFolders = await prisma.folder.findMany({
        where: { parentId: folderId, userId: (req.user as any).id },
        select: { id: true },
      });

      let allFiles = [...files];

      for (const childFolder of childFolders) {
        const childFiles = await getAllFilesInFolder(childFolder.id);
        allFiles = allFiles.concat(childFiles);
      }

      return allFiles;
    };

    const files = await getAllFilesInFolder(folderId);

    const imageFiles = files
      .filter((f) => f.fileType.startsWith("image/"))
      .map((f) => f.publicId);
    const videoFiles = files
      .filter((f) => f.fileType.startsWith("video/"))
      .map((f) => f.publicId);
    const rawFiles = files
      .filter(
        (f) =>
          !f.fileType.startsWith("image/") && !f.fileType.startsWith("video/")
      )
      .map((f) => f.publicId);

    const deleteInChunks = async (
      publicIds: string[],
      resourceType: "image" | "video" | "raw"
    ) => {
      const chunkSize = 100;
      for (let i = 0; i < publicIds.length; i += chunkSize) {
        const chunk = publicIds.slice(i, i + chunkSize);
        try {
          await cloudinary.api.delete_resources(chunk, {
            type: "private",
            resource_type: resourceType,
          });
        } catch (error) {
          console.error(`Error deleting ${resourceType} files:`, error);
        }
      }
    };

    if (imageFiles.length > 0) await deleteInChunks(imageFiles, "image");
    if (videoFiles.length > 0) await deleteInChunks(videoFiles, "video");
    if (rawFiles.length > 0) await deleteInChunks(rawFiles, "raw");

    const fileIds = files.map((f) => f.id);
    if (fileIds.length > 0) {
      await prisma.files.deleteMany({
        where: {
          id: { in: fileIds },
          userId: (req.user as any).id,
        },
      });
    }

    const deletedFolder = await prisma.folder.delete({
      where: {
        id: folderId,
        userId: (req.user as any).id,
      },
    });
    const path = deletedFolder.parentId
      ? `/folders/${deletedFolder.parentId}`
      : "/";
    res.redirect(path);
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function updateFolderById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.isUnauthenticated()) {
    return res.redirect("/log-in");
  }
  const folderId = Number(req.params.id);
  const newFolderName = req.body.name;
  try {
    const updatedFolder = await prisma.folder.update({
      where: {
        id: folderId,
        userId: (req.user as any).id,
      },
      data: {
        name: newFolderName,
      },
    });
    const path = updatedFolder.parentId
      ? `/folders/${updatedFolder.parentId}`
      : "/";
    res.redirect(path);
  } catch (err) {
    next(err);
  }
}

async function getUpdateForm(req: Request, res: Response, next: NextFunction) {
  if (req.isUnauthenticated()) {
    return res.redirect("/log-in");
  }
  const folderId = Number(req.params.id);
  const previousUrl = req.get("Referer") || "/";
  try {
    const folder = await prisma.folder.findUnique({
      where: {
        id: folderId,
        userId: (req.user as any).id,
      },
    });
    if (!folder) {
      return res.status(404).render("error", { message: "Folder not found" });
    }
    res.locals.isUpdate = true;
    res.locals.folderName = folder?.name;
    res.render("folders", { folderId: folderId, previousUrl: previousUrl });
  } catch (err) {
    next(err);
  }
}

export {
  getFolderForm,
  postFolder,
  getFolderById,
  getFolderFormWithId,
  postFolderWithId,
  deleteFolderById,
  getUpdateForm,
  updateFolderById,
};
