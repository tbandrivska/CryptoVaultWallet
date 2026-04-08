import express from "express";
import transactionRoutes from "./routes/transactionRoutes.js";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use("/api/transactions", transactionRoutes);

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
