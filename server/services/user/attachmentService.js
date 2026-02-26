const multer = require("multer");
const path = require("path");
const fs = require("fs");
const userRepository = require("../../repositories/userRepository");

const createServiceError = (status, message, error) => ({ status, message, error });

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${req.user.user_id}_${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only images, PDFs, and documents are allowed"));
  },
});

const uploadFile = async (file) => {
  if (!file) {
    throw createServiceError(400, "No file uploaded");
  }

  return {
    file_name: file.originalname,
    file_path: file.path,
    file_size: file.size,
    file_type: file.mimetype,
    server_filename: file.filename,
  };
};

const saveAttachments = async ({ user_id, attachmentRecords, is_draft }) => {
  const records = attachmentRecords;
  const isDraft = is_draft === "Y" ? "Y" : "N";

  if (!Array.isArray(records)) {
    throw createServiceError(400, "Invalid data format.");
  }

  const savedRecords = [];

  for (const record of records) {
    const { attachment_id, document_type, document_name, file_name, file_path, file_size, file_type } = record;

    const isResume = document_type === "Resume" || (attachment_id === undefined && savedRecords.length === 0);
    const hasFile = file_name && file_path;
    const hasContent = document_type || document_name;

    if (!hasContent && !hasFile && isDraft === "N" && !isResume) {
      continue;
    }

    if (attachment_id) {
      await userRepository.executeQuery(
        `
          UPDATE tbl_attachments SET
            document_type = ?, document_name = ?, file_name = ?,
            file_path = ?, file_size = ?, file_type = ?, is_draft = ?
          WHERE attachment_id = ? AND user_id = ?
        `,
        [
          document_type || null,
          document_name || null,
          file_name || null,
          file_path || null,
          file_size || null,
          file_type || null,
          isDraft,
          attachment_id,
          user_id,
        ]
      );

      savedRecords.push({
        attachment_id,
        document_type,
        document_name,
        file_name,
        file_path,
        file_size,
        file_type,
        is_draft: isDraft,
      });
    } else {
      const result = await userRepository.executeQuery(
        `
          INSERT INTO tbl_attachments (
            user_id, document_type, document_name, file_name,
            file_path, file_size, file_type, is_draft
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          user_id,
          document_type || null,
          document_name || null,
          file_name || null,
          file_path || null,
          file_size || null,
          file_type || null,
          isDraft,
        ]
      );

      savedRecords.push({
        attachment_id: result.insertId,
        document_type,
        document_name,
        file_name,
        file_path,
        file_size,
        file_type,
        is_draft: isDraft,
      });
    }
  }

  return {
    success: true,
    message: `Attachments ${isDraft === "Y" ? "saved as draft" : "submitted"} successfully.`,
    data: savedRecords,
  };
};

const getAttachments = async (user_id) => {
  const records = await userRepository.executeQuery(
    `SELECT * FROM tbl_attachments WHERE user_id = ? ORDER BY attachment_id ASC`,
    [user_id]
  );
  return records;
};

const deleteAttachments = async ({ user_id, attachment_id }) => {
  if (!attachment_id) {
    throw createServiceError(400, "Attachment ID is required");
  }

  const fileRecords = await userRepository.executeQuery(
    `SELECT file_path, file_name FROM tbl_attachments WHERE attachment_id = ? AND user_id = ?`,
    [attachment_id, user_id]
  );

  if (!fileRecords.length) {
    throw createServiceError(404, "Attachment not found");
  }

  const fileRecord = fileRecords[0];
  const result = await userRepository.executeQuery(
    `DELETE FROM tbl_attachments WHERE attachment_id = ? AND user_id = ?`,
    [attachment_id, user_id]
  );

  if (result.affectedRows === 0) {
    throw createServiceError(500, "Failed to delete database record");
  }

  let fileDeleteResult = { success: true, message: "No file to delete" };
  if (fileRecord.file_path) {
    try {
      if (fs.existsSync(fileRecord.file_path)) {
        fs.unlinkSync(fileRecord.file_path);
        fileDeleteResult = { success: true, message: `Physical file deleted: ${fileRecord.file_name}` };
      } else {
        fileDeleteResult = { success: true, message: `File not found on disk: ${fileRecord.file_name}` };
      }
    } catch (fileErr) {
      fileDeleteResult = { success: false, message: `Failed to delete file: ${fileErr.message}` };
    }
  }

  return {
    success: true,
    message: "Attachment deleted successfully",
    details: {
      database: "Record deleted",
      file: fileDeleteResult.message,
    },
  };
};

const replaceAttachmentFile = async ({ user_id, attachment_id }) => {
  if (!attachment_id) {
    throw createServiceError(400, "Attachment ID is required");
  }

  const attachmentRecords = await userRepository.executeQuery(
    `SELECT file_path FROM tbl_attachments WHERE attachment_id = ? AND user_id = ?`,
    [attachment_id, user_id]
  );

  if (!attachmentRecords.length) {
    throw createServiceError(404, "Attachment not found");
  }

  const currentFilePath = attachmentRecords[0].file_path;
  let fileDeleteResult = { success: true, message: "No file to delete" };

  if (currentFilePath && fs.existsSync(currentFilePath)) {
    try {
      fs.unlinkSync(currentFilePath);
      fileDeleteResult = { success: true, message: "Old file deleted successfully" };
    } catch (fileErr) {
      fileDeleteResult = { success: false, message: `Failed to delete old file: ${fileErr.message}` };
    }
  } else {
    fileDeleteResult = { success: true, message: "Old file not found on disk" };
  }

  return {
    success: true,
    message: "File replacement prepared",
    details: fileDeleteResult,
  };
};

module.exports = {
  saveAttachments,
  getAttachments,
  deleteAttachments,
  uploadFile,
  uploadMiddleware: upload.single("file"),
  replaceAttachmentFile,
};
