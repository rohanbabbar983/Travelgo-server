import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

import tripRoutes from "./src/routes/tripRoutes.js";
import hotelRoutes from "./src/routes/hotelRoutes.js";
import attractionRoutes from "./src/routes/attractionRoutes.js";
import errorHandler from "./src/middlewares/errorHandler.js";
import chatRoutes from "./src/routes/chatRoutes.js"

const app = express();

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
const corsOptions = {
        origin: allowedOrigin,
        optionsSuccessStatus: 200 
    };

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/trips", tripRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/attractions", attractionRoutes);
app.use("/api/assist", chatRoutes);          


app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
