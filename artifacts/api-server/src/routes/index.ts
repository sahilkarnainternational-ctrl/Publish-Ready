import { Router, type IRouter } from "express";
import healthRouter from "./health";
import youtubeRouter from "./youtube";
import emailRouter from "./email";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(youtubeRouter);
router.use(emailRouter);
router.use(chatRouter);

export default router;
