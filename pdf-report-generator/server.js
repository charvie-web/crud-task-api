
const express = require("express");
const path = require("node:path");
const fs = require("node:fs");
const { DatabaseSync } = require("node:sqlite");
const { generatePdf } = require("./generatePdf");
const { randomUUID } = require("node:crypto");

const app = express();
const PORT = 3001;

app.use(express.json());

const db = new DatabaseSync("report.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    path TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});


// Create a new report

app.post("/reports", async (req, res) => {
  try {
    const force = req.body?.force === true;

    // Reuse today's report unless force is true
    if (!force) {
      const existing = db.prepare(`
        SELECT id FROM reports
        WHERE date(created_at) = date('now')
        ORDER BY created_at DESC
        LIMIT 1
      `).get();

      if (existing) {
        return res.status(200).json({
          id: existing.id,
          file: `/reports/${existing.id}/file`
        });
      }
    }

    const id = randomUUID();
    const filePath = path.join("reports", `${id}.pdf`);

    await generatePdf(filePath);

    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO reports (id, path, created_at)
      VALUES (?, ?, ?)
    `).run(id, filePath, createdAt);

    res.status(201).json({
      id,
      file: `/reports/${id}/file`
    });
  } catch (error) {
    console.error("Report creation failed:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});


// Get report details
app.get("/reports/:id", (req, res) => {
  const report = db.prepare(`
    SELECT id, path, created_at
    FROM reports
    WHERE id = ?
  `).get(req.params.id);

  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }

  res.json({
    id: report.id,
    file: `/reports/${report.id}/file`,
    created_at: report.created_at
  });
});

// Download the generated PDF
app.get("/reports/:id/file", (req, res) => {
  const report = db.prepare(`
    SELECT path FROM reports WHERE id = ?
  `).get(req.params.id);

  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }

  const absolutePath = path.resolve(report.path);

  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({ error: "PDF file not found" });
  }

  res.sendFile(absolutePath);
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
