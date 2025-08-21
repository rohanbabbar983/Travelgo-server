import express from "express";
import { getAttractions } from "../controllers/attractionController.js";

const router = express.Router();

router.get("/", getAttractions);

export default router;
