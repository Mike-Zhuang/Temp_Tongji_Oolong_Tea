import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, "screenshots");
const baseUrl = process.env.VISUAL_QA_BASE_URL ?? "http://127.0.0.1:4173";

const routes = [
  { name: "home", path: "/" },
  { name: "search", path: "/search?q=" },
  { name: "course", path: "/course/29300" },
  { name: "teacher", path: "/teacher/%E8%A2%81%E5%9F%B9" },
  { name: "auth", path: "/auth" },
  { name: "write-review", path: "/write-review/29300" },
];

const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 900 },
];

async function main() {
  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    for (const route of routes) {
      const url = `${baseUrl}${route.path}`;
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(1500);

      const filePath = path.join(outputDir, `${route.name}-${viewport.name}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      console.log(`Saved ${filePath}`);
    }
  }

  await browser.close();
  console.log("Visual QA screenshots complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
