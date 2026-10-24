import { Router } from "express";
import { submitEnquiry } from "../controllers/enquiryController.js";

const router = Router();

router.post("/", submitEnquiry);

export default router;
