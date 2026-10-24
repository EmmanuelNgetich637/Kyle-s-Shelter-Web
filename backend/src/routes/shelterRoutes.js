import { Router } from "express";
import {
  listShelters,
  getShelterBySlug,
} from "../controllers/shelterController.js";

const router = Router();

router.get("/", listShelters);
router.get("/:slug", getShelterBySlug);

export default router;
