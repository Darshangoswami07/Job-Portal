import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { createMessage, getMessages, markMessageRead, deleteMessage } from "../controllers_new/contactController.js";

const router = express.Router();

router.route("/").post(createMessage).get(isAuthenticated, getMessages);
router.route("/:id/read").patch(isAuthenticated, markMessageRead);
router.route("/:id").delete(isAuthenticated, deleteMessage);

export default router;
