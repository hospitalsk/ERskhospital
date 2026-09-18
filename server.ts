import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const getPublicConfigPath = () => path.join(process.cwd(), "public", "db_config.json");
  const getDistConfigPath = () => path.join(process.cwd(), "dist", "db_config.json");

  // API route: Get Supabase DB configuration
  app.get("/api/db-config", (req, res) => {
    try {
      const publicPath = getPublicConfigPath();
      const distPath = getDistConfigPath();

      let targetPath = publicPath;
      if (!fs.existsSync(publicPath) && fs.existsSync(distPath)) {
        targetPath = distPath;
      }

      if (fs.existsSync(targetPath)) {
        const raw = fs.readFileSync(targetPath, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && parsed.url && parsed.key) {
          return res.json({
            success: true,
            url: parsed.url,
            key: parsed.key,
            updatedAt: parsed.updatedAt || "",
          });
        }
      }

      // Check environment variables as fallback
      const envUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
      const envKey = process.env.VITE_SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || "";
      if (envUrl && envKey) {
        return res.json({
          success: true,
          url: envUrl,
          key: envKey,
          updatedAt: new Date().toISOString(),
        });
      }

      return res.json({ success: false, url: "", key: "" });
    } catch (err: any) {
      console.error("Error reading database config:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // API route: Save Supabase DB configuration permanently for all devices
  app.post("/api/db-config", (req, res) => {
    try {
      const { url, key } = req.body || {};
      if (!url || !key) {
        return res.status(400).json({ success: false, error: "Supabase URL and Key are required" });
      }

      const configData = {
        url: String(url).trim(),
        key: String(key).trim(),
        updatedAt: new Date().toISOString(),
      };

      const publicDir = path.join(process.cwd(), "public");
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      fs.writeFileSync(getPublicConfigPath(), JSON.stringify(configData, null, 2), "utf-8");

      const distDir = path.join(process.cwd(), "dist");
      if (fs.existsSync(distDir)) {
        fs.writeFileSync(getDistConfigPath(), JSON.stringify(configData, null, 2), "utf-8");
      }

      console.log(`[Supabase Config] Saved connection credentials permanently at ${configData.updatedAt}`);
      return res.json({
        success: true,
        message: "Supabase configuration saved permanently for all devices.",
      });
    } catch (err: any) {
      console.error("Error writing database config:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
