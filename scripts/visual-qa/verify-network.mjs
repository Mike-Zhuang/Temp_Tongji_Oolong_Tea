import { chromium } from "playwright";

const baseUrl = process.env.VISUAL_QA_BASE_URL ?? "http://127.0.0.1:4173";

function getPathname(url) {
  const pathStart = url.indexOf("/", url.indexOf("//") + 2);
  return pathStart >= 0 ? url.slice(pathStart).split("?")[0] : url;
}

async function collectRequests(page, path) {
  const requests = [];
  page.on("request", (request) => {
    requests.push(getPathname(request.url()));
  });
  await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500);
  return requests;
}

async function main() {
  const browser = await chromium.launch();

  const homeContext = await browser.newContext();
  const homePage = await homeContext.newPage();
  const homeRequests = await collectRequests(homePage, "/");
  await homeContext.close();

  const courseContext = await browser.newContext();
  const coursePage = await courseContext.newPage();
  const courseRequests = await collectRequests(coursePage, "/course/29300");
  await courseContext.close();

  const mobilePage = await browser.newPage();

  const homeHasSummary = homeRequests.some((path) => path.includes("home-summary.json"));
  const homeHasSeed = homeRequests.some((path) => path.includes("wlc.courses.json") || path.includes("wlc.ratings.json"));
  const courseHasSeed = courseRequests.some((path) => path.includes("wlc.courses.json") || path.includes("wlc.ratings.json"));

  console.log("=== Home page network paths ===");
  console.log(homeRequests.filter((path) => path.includes("/data/") || path.includes("/assets/index")).join("\n") || "(none)");
  console.log(`home-summary loaded: ${homeHasSummary}`);
  console.log(`seed loaded on home: ${homeHasSeed}`);

  console.log("\n=== Course page network paths (data) ===");
  console.log(
    courseRequests.filter((path) => path.includes("/data/")).join("\n") || "(none)",
  );
  console.log(`seed loaded on course: ${courseHasSeed}`);

  await mobilePage.setViewportSize({ width: 375, height: 812 });
  await mobilePage.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  const searchButton = mobilePage.locator('button[type="submit"]', { hasText: "搜索" });
  const box = await searchButton.boundingBox();
  const text = await searchButton.innerText();
  console.log("\n=== Mobile search button ===");
  console.log(`text: "${text.trim()}"`);
  console.log(`width: ${box?.width?.toFixed(1)} height: ${box?.height?.toFixed(1)}`);
  console.log(`horizontal layout: ${box && box.width > box.height ? "PASS" : "FAIL"}`);

  const failures = [];
  if (!homeHasSummary) failures.push("home missing home-summary.json");
  if (homeHasSeed) failures.push("home should not load full seed JSON");
  if (!courseHasSeed) failures.push("course page should load seed JSON fallback");
  if (!box || box.width <= box.height) failures.push("search button not horizontal on mobile");

  await browser.close();

  if (failures.length) {
    console.error("\nVERIFICATION FAILED:");
    failures.forEach((item) => console.error(`- ${item}`));
    process.exit(1);
  }

  console.log("\nAll deep verification checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
