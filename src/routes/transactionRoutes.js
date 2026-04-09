import express from "express";
import { sendCryptoController } from "../controllers/sendCryptoController.js";
import { getTransactionHistory } from "../controllers/getTransactionHistory.js";
import { getLatestTransaction } from "../transaction/transactionService.js";

import {
  createRecurringController,
  getRecurringController,
  cancelRecurringController
} from "../controllers/recurringController.js";

const router = express.Router();

router.get("/latest", async (req, res) => {
    try {
        const { walletId } = req.query; // Or get it from a session/auth
        if (!walletId) {
            return res.status(400).json({ error: "Wallet ID is required" });
        }

        const latestTx = await getLatestTransaction(walletId);
        res.json(latestTx);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error fetching latest transaction" });
    }
});

router.post("/send", sendCryptoController);

router.get("/history", getTransactionHistory);

router.post("/recurring", createRecurringController);

router.get("/recurring", getRecurringController);
router.get("/history/:walletId", getTransactionHistory);
router.delete("/recurring/:id", cancelRecurringController);

export default router;
//router.post("/send", sendTransaction);