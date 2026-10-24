import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import healthRoutes from "./routes/healthRoutes.js";
import shelterRoutes from "./routes/shelterRoutes.js";
import enquiryRoutes from "./routes/enquiryRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import adminEnquiryRoutes from "./routes/adminEnquiryRoutes.js";
import adminShelterRoutes from "./routes/adminShelterRoutes.js";
import adminQuotationRoutes from "./routes/adminQuotationRoutes.js";

import {
  notFoundHandler,
  errorHandler,
} from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json({ limit: "1mb" }));

app.use("/api/health", healthRoutes);
app.use("/api/shelters", shelterRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/admin", adminAuthRoutes);
app.use("/api/admin/enquiries", adminEnquiryRoutes);
app.use("/api/admin/shelters", adminShelterRoutes);
app.use("/api/admin/quotations", adminQuotationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Shelter Sales API running on port ${PORT}`);
});
