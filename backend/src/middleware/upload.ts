import multer from "multer";

const memoryStorage = multer.memoryStorage();

/** Single image upload for profile avatar or cover (max 8 MB raw buffer). */
export const profileImageUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
      return;
    }
    cb(new Error("Only image uploads are allowed"));
  },
}).single("file");
