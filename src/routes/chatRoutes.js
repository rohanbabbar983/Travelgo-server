// src/routes/chatRoutes.js
import express from "express";
import { askAssistant } from "../controllers/chatController.js";

const router = express.Router();
router.post("/ask", askAssistant); // POST /assist/ask  { message: "..." }

export default router;
