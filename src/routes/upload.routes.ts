import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { uploadImage } from '../config/multer';
import { ok } from '../utils/response';
import { ApiError } from '../utils/ApiError';

const router = Router();
router.use(authenticate);

router.post(
  '/',
  uploadImage.fields([{ name: 'file', maxCount: 1 }, { name: 'image', maxCount: 1 }]),
  (req, res) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const file = files?.file?.[0] || files?.image?.[0] || req.file;
    if (!file) throw ApiError.badRequest('No image file uploaded');
    const url = `/uploads/${file.filename}`;
    ok(res, { url, filename: file.filename, size: file.size, mimetype: file.mimetype }, { message: 'Image uploaded successfully' });
  }
);

export default router;

