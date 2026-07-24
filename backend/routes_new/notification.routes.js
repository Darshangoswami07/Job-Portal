import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from "../controllers_new/notificationController.js";

const router = express.Router();

router.route("/").get(isAuthenticated, getNotifications);
router.route("/read-all").patch(isAuthenticated, markAllAsRead);
router.route("/:id/read").patch(isAuthenticated, markAsRead);
router.route("/:id").delete(isAuthenticated, deleteNotification);

export default router;
