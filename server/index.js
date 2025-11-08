import express from "express";
import cors from "cors";

const app = express();

// Allow JSON bodies
app.use(express.json());

// Allow requests from the extension (we'll run on localhost)
app.use(cors());

// Simple health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "aura-server" });
});

// Placeholder endpoint for command interpretation (will use Gemini later)
app.post("/api/interpret-command", (req, res) => {
  const { transcript } = req.body || {};

  // For now, just echo back a stub response
  res.json({
    action: "none",
    rawTranscript: transcript || ""
  });
});

// Placeholder endpoint for page summarization (will use Gemini later)
app.post("/api/summarize", (req, res) => {
  const { pageText } = req.body || {};

  // For now, return a very naive "summary"
  const snippet = (pageText || "").slice(0, 200);
  res.json({
    summary: snippet
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`AURA server listening on http://localhost:${PORT}`);
});
