import multer from "multer";
import { MAX_ATTACHMENT_BYTES, isAllowedImageMime } from "./attachments.js";

export const screenshotUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ATTACHMENT_BYTES },
  fileFilter: (_req, file, cb) => {
    if (isAllowedImageMime(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PNG, JPEG, WebP, and GIF images are allowed"));
    }
  },
});

/** @param {import('express').Request} req @param {import('express').Response} res @param {import('express').NextFunction} next */
export function optionalScreenshotUpload(req, res, next) {
  if (!req.is("multipart/form-data")) return next();
  screenshotUpload.single("screenshot")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        error: err.message || "Invalid screenshot upload",
      });
    }
    next();
  });
}
