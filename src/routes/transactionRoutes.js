import express from "express";
import { sendCryptoController } from "../controllers/sendCryptoController.js";
import { getTransactionHistory } from "../controllers/getTransactionHistory.js";

import {
  createRecurringController,
  getRecurringController,
  cancelRecurringController
} from "../controllers/recurringController.js";

const router = express.Router();

router.post("/send", sendCryptoController);

router.get("/history", getTransactionHistory);

router.post("/recurring", createRecurringController);

router.get("/recurring", getRecurringController);

router.delete("/recurring/:id", cancelRecurringController);

export default router;
router.post("/send", sendTransaction);