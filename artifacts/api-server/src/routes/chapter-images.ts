import { Router } from "express";
import imagesHandler from '../../../../api/chapter-images.js';

const router = Router();

router.post('/chapter-images', async (req, res, next) => {
  try {
    await imagesHandler(req, res);
  } catch (err) {
    next(err);
  }
});

router.options('/chapter-images', (req, res) => res.sendStatus(200));

export default router;
