import type { Response, Request, NextFunction } from "express";
import { prisma } from "../db/prisma.ts";

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
    const folder = await prisma.folder.create({
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
    const folders = await prisma.folder.findMany({
      where: {
        parentId: folderId,
        userId: (req.user as any).id,
      },
    });
    const parentFolder = await prisma.folder.findUnique({
      where: {
        id: folderId,
        userId: (req.user as any).id,
      },
    });
    res.render("home", {
      folders: folders,
      title: parentFolder?.name,
      folderId: folderId,
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
  res.render("folders", { folderId });
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
  try {
    const folder = await prisma.folder.findUnique({
      where: {
        id: folderId,
        userId: (req.user as any).id,
      },
    });
    res.locals.isUpdate = true;
    res.locals.folderName = folder?.name;
    res.render("folders", { folderId: folderId });
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
