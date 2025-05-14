import express from "express";
import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

async function getFinalLink(adUrl) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-gpu",
    ],
  });

  const page = await browser.newPage();
  try {
    await page.goto(adUrl, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("button.custom-btn.btn-1");

    await page.evaluate(() => {
      const btn = document.querySelector("button.custom-btn.btn-1");
      if (btn) btn.click();
    });

    await page.waitForNavigation({ waitUntil: "networkidle0" });
    return page.url();
  } catch (err) {
    console.error(`❌ Failed for ${adUrl}:`, err.message);
    return null;
  } finally {
    await browser.close();
  }
}

app.post("/api/process-links", async (req, res) => {
  const { links } = req.body;
  if (!Array.isArray(links))
    return res.status(400).json({ error: "Invalid links" });

  const results = [];
  for (const link of links) {
    const result = await getFinalLink(link);
    if (result) results.push(result);
  }

  res.json({ results });
});

app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
app.post("/api/process-link", async (req, res) => {
  const { link } = req.body;
  if (!link) return res.status(400).json({ error: "Missing link" });

  const result = await getFinalLink(link);
  if (result) {
    res.json({ result });
  } else {
    res.status(500).json({ error: "Failed to extract final link" });
  }
});
