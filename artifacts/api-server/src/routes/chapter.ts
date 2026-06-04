import { Router } from "express";
// Import the serverless handler from the monorepo /api folder.
// The path is relative to this file and resolves to /api/chapter.js
import chapterHandler from '../../../../api/chapter.js';

const router = Router();

router.post('/chapter', async (req, res, next) => {
  try {
    await chapterHandler(req, res);
  } catch (err) {
    next(err);
  }
});

router.options('/chapter', (req, res) => res.sendStatus(200));

export default router;
