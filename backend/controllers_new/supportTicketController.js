import { SupportTicket } from "../models_new/SupportTicket.js";

export const createTicket = async (req, res) => {
  try {
    const { name, email, subject, category, message } = req.body;
    if (!name || !email || !subject || !message) return res.status(400).json({ success: false, message: "Name, email, subject, and message are required" });
    const ticket = await SupportTicket.create({ name, email, subject, category: category || "general", message, user: req.id || null, messages: [{ sender: req.id || null, senderName: name, message }] });
    res.status(201).json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.id }).sort({ createdAt: -1 });
    res.json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({ _id: req.params.id, user: req.id });
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addTicketMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: "Message is required" });
    const ticket = await SupportTicket.findOne({ _id: req.params.id, user: req.id });
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
    ticket.messages.push({ sender: req.id, senderName: req.body.senderName || "User", message, isStaff: false });
    if (ticket.status === "resolved" || ticket.status === "closed") ticket.status = "open";
    await ticket.save();
    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllTickets = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [tickets, total] = await Promise.all([
      SupportTicket.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      SupportTicket.countDocuments(query),
    ]);
    res.json({ success: true, tickets, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, { status, resolvedAt: status === "resolved" ? new Date() : undefined }, { new: true });
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
