import { Router, type IRouter } from "express";
import healthRouter from "./health";
import youtubeRouter from "./youtube";
import emailRouter from "./email";
import chatRouter from "./chat";
import chapterRouter from "./chapter";
import chapterImagesRouter from "./chapter-images";
import ipinfoRouter from "./ipinfo";

const router: IRouter = Router();

router.use(healthRouter);
router.use(youtubeRouter);
router.use(emailRouter);
router.use(chatRouter);
router.use(chapterRouter);
router.use(chapterImagesRouter);
router.use(ipinfoRouter);

export default router;
