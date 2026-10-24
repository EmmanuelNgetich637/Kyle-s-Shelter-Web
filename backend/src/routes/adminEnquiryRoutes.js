import { Router } from "express";
import {
  listEnquiries,
  updateEnquiryStatus,
} from "../controllers/adminEnquiryController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = Router();

router.use(requireAdmin);

router.get("/", listEnquiries);
router.patch("/:id/status", updateEnquiryStatus);

export default router;
