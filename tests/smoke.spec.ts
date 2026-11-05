import { expect, test, type Page } from "@playwright/test";

const PAGES = [
  { path: "/", title: /Nimbrial/, heading: /Business systems/ },
  { path: "/services/", title: /Services — Nimbrial/, heading: /scoped and priced honestly/ },
  { path: "/about/", title: /About — Nimbrial/, heading: /systems behind growing businesses/ },
] as const;

// Records console errors, uncaught exceptions and failed same-origin requests while a page is open.
function trackProblems(page: Page) {
  const problems: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") problems.push(`console.error: ${msg.text()}`);
  });
  page.on("pageerror", (err) => problems.push(`uncaught: ${err.message}`));
  page.on("response", (res) => {
    if (res.status() >= 400 && res.url().startsWith(new URL(page.url() || "http://127.0.0.1").origin)) {
      problems.push(`HTTP ${res.status()}: ${res.url()}`);
    }
  });
  return problems;
}

// Scrolls to the bottom in viewport-sized steps so every scroll-triggered animation fires.
async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.6));
    for (let y = 0; y <= document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
}

for (const { path, title, heading } of PAGES) {
  test.describe(`page ${path}`, () => {
    test("loads with no console errors, failed requests or crashes", async ({ page }) => {
      const problems = trackProblems(page);
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(title);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
      await page.waitForLoadState("networkidle");
      await scrollThrough(page);
      await page.waitForLoadState("networkidle");
      expect(problems).toEqual([]);
    });

    test("every revealed block becomes visible after scrolling", async ({ page }) => {
      await page.goto(path);
      await scrollThrough(page);
      // Animated content starts at opacity 0; none of it may stay hidden.
      await expect
        .poll(
          () =>
            page.$$eval("[data-reveal]", (els) =>
              els.filter((el) => Number(getComputedStyle(el).opacity) < 0.99).length,
            ),
          { timeout: 5_000 },
        )
        .toBe(0);
    });

    test("is fully visible with reduced motion and no animation", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      const hidden = await page.$$eval("[data-reveal]", (els) =>
        els.filter((el) => Number(getComputedStyle(el).opacity) < 0.99).length,
      );
      expect(hidden).toBe(0);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  });
}

test("every internal link resolves", async ({ page, request }) => {
  const hrefs = new Set<string>();
  for (const { path } of PAGES) {
    await page.goto(path);
    const found = await page.$$eval("a[href]", (as) =>
      as.map((a) => a.getAttribute("href") ?? "").filter((h) => h.startsWith("/")),
    );
    found.forEach((h) => hrefs.add(h.split("#")[0] || "/"));
  }
  expect(hrefs.size).toBeGreaterThan(0);
  for (const href of hrefs) {
    const res = await request.get(href);
    expect(res.status(), `link ${href}`).toBe(200);
  }
});

test("unknown pages return a 404", async ({ request }) => {
  const res = await request.get("/this-page-does-not-exist/");
  expect(res.status()).toBe(404);
});

test.describe("desktop navigation", () => {
  test.skip(({ isMobile }) => isMobile, "desktop nav is hidden on mobile");

  test("nav links open each page", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation");
    for (const { path, heading } of [PAGES[1], PAGES[2], PAGES[0]]) {
      const name = path === "/" ? "Home" : path === "/services/" ? "Services" : "About";
      await nav.getByRole("link", { name, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
    }
  });
});

test.describe("mobile navigation", () => {
  test.skip(({ isMobile }) => !isMobile, "menu button only exists on mobile");

  test("menu opens, navigates and closes", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("link", { name: /Services/ }).first().click();
    await expect(page).toHaveURL(/\/services\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(PAGES[1].heading);
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  });
});
