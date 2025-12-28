import type { NextFunction, Request, Response } from "express";
import multer from "multer";

const upload = multer({ dest: "uploads/" });

function getFileForm(req: Request, res: Response) {
  if (req.isUnauthenticated()) {
    return res.redirect("/");
  }
  res.render("files.ejs");
}

function postFile(req: Request, res: Response) {
  console.log(req.file, req.body);
  res.redirect("/");
}

const postFilePipeline = [
  (req: Request, res: Response, next: NextFunction) => {
    if (req.isUnauthenticated()) {
      return res.redirect("/");
    }
    next();
  },
  upload.single("userFile"),
  postFile,
];

export { getFileForm, postFilePipeline };
