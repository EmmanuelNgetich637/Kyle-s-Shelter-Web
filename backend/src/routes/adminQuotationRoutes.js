import { Router } from "express";
import {
  listAdminQuotations,
  getAdminQuotation,
  createAdminQuotation,
  changeAdminQuotationStatus,
} from "../controllers/adminQuotationController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = Router();

router.use(requireAdmin);

router.get("/", listAdminQuotations);
router.post("/", createAdminQuotation);
router.get("/:id", getAdminQuotation);
router.patch("/:id/status", changeAdminQuotationStatus);

export default router;
