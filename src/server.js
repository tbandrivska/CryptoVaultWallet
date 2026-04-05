import app from "./app.js";

const PORT = 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
import express from "express";
import transactionRoutes from "./routes/transactionRoutes.js";

const app = express();

app.use(express.json());
app.use("/api/transactions", transactionRoutes);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});