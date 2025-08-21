import express from "express";
import { getTrips } from "../controllers/tripController.js";

const router = express.Router();

router.get("/", getTrips);

export default router;
