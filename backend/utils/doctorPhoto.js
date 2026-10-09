// Doctor portraits are read into memory, checked, and stored in the database (the server's disk is wiped on deploy)
const multer = require("multer");

const MAX_BYTES = 3 * 1024 * 1024;

// The file's first bytes must match its declared type, so a renamed file is refused
const SIGNATURES = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/webp": (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP",
};

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES } }).single("photo");

// Express middleware: on success req.photo = { data, type }; otherwise a 400 with a clear message
const readPhoto = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      const tooBig = err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE";
      return res.status(400).json({ message: tooBig ? "The photo must be 3 MB or smaller" : "Could not read the photo" });
    }
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "Choose a photo to upload" });
    }
    const matches = SIGNATURES[file.mimetype];
    if (!matches || !matches(file.buffer)) {
      return res.status(400).json({ message: "Only JPG, PNG or WebP images are allowed" });
    }
    req.photo = { data: file.buffer, type: file.mimetype };
    next();
  });
};

module.exports = { readPhoto, MAX_BYTES };
