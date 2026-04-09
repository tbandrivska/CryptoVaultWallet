import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import transactionRoutes from "./routes/transactionRoutes.js";
import userRoutes from './routes/userRoutes.js';
import { loginUser } from './config/login.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../public")));

app.use("/api/transactions", transactionRoutes);
app.use('/api/users', userRoutes);

// Show login page
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "login.html"));
});

// Handle login form
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await loginUser(email, password);

    if (user) {
      return res.redirect('/portfolio.html');
    } else {
      return res.redirect('/login.html?error=1');
    }
  } catch (err) {
    return res.redirect('/login.html?error=1');
  }
});

export default app;