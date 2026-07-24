import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { createTicket, getMyTickets, getTicketById, addTicketMessage, getAllTickets, updateTicketStatus } from "../controllers_new/supportTicketController.js";

const router = express.Router();

router.route("/").post(createTicket).get(isAuthenticated, getMyTickets);
router.route("/all").get(isAuthenticated, getAllTickets);
router.route("/:id").get(isAuthenticated, getTicketById);
router.route("/:id/message").post(isAuthenticated, addTicketMessage);
router.route("/:id/status").patch(isAuthenticated, updateTicketStatus);

export default router;
