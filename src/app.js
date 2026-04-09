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
app.use
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


// Ensure this is near your other app.use calls in app.js
app.get('/api/chart/:coinId', async (req, res) => {
    try {
        const { coinId } = req.params;
        const apiKey = 'CG-2UhE78yESRWdrAX3pU6fMsCZ'; // Your API Key
        const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=gbp&days=7`;

        const response = await fetch(url, {
            headers: {
                'accept': 'application/json',
                'x-cg-demo-api-key': apiKey
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: "CoinGecko Error" });
        }

        const data = await response.json();
        res.json(data); // Send actual JSON
    } catch (error) {
        console.error("Proxy Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default app;