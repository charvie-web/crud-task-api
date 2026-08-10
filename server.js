const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.json({ message: "Hello from my CRUD API!" });
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});