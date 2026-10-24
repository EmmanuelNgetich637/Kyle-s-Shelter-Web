import { Router } from "express";
import {
  listAllShelters,
  createShelterRecord,
  updateShelterRecord,
} from "../controllers/adminShelterController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = Router();

router.use(requireAdmin);

router.get("/", listAllShelters);
router.post("/", createShelterRecord);
router.put("/:id", updateShelterRecord);

export default router;
