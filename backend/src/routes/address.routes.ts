// =============================================================================
// /api/addresses — buyer delivery addresses
// =============================================================================

import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { addressBodySchema, addressUpdateSchema } from "../types";
import * as addressController from "../controllers/address.controller";

const router = Router();

router.use(requireAuth);

router.get("/", addressController.list);
router.post("/", validate(addressBodySchema), addressController.create);
router.get("/:id", addressController.get);
router.put("/:id", validate(addressUpdateSchema), addressController.update);
router.delete("/:id", addressController.remove);

export default router;
