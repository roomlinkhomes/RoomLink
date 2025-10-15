// server.js
require("dotenv").config(); // ✅ loads .env variables

const express = require("express");
const admin = require("./firebase");
const authRoutes = require("./routes/auth");

const app = express();
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("🚀 Backend running & Firebase connected");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("🔥 Server running on port " + PORT);
});
