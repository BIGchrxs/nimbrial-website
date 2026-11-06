import { expect, test, type Page } from "@playwright/test";

const PAGES = [
  { path: "/", title: /Nimbrial/, heading: /engineering evolution/ },
  { path: "/services/", title: /Services — Nimbrial/, heading: /scoped and priced honestly/ },
  { path: "/about/", title: /About — Nimbrial/, heading: /systems behind growing businesses/ },
  { path: "/contact/", title: /Book a discovery call — Nimbrial/, heading: /Book a discovery call/ },
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

test("every page links working site icons", async ({ page, request }) => {
  for (const { path } of PAGES) {
    await page.goto(path);
    const icons = await page.$$eval('link[rel="icon"], link[rel="apple-touch-icon"]', (links) =>
      links.map((l) => ({ rel: l.getAttribute("rel"), href: l.getAttribute("href") ?? "" })),
    );
    expect(icons.map((i) => i.rel), `${path} icon links`).toEqual(
      expect.arrayContaining(["icon", "apple-touch-icon"]),
    );
    for (const { href } of icons) {
      const res = await request.get(href);
      expect(res.status(), `icon ${href}`).toBe(200);
      expect(res.headers()["content-type"], `icon ${href}`).toMatch(/^image\//);
    }
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

  test("top bar hides once when scrolling down and returns when scrolling up", async ({ page }) => {
    await page.goto("/about/");
    // Record every hide/show change of the fixed header while we scroll.
    await page.evaluate(() => {
      const header = document.querySelector("header")!;
      const w = window as unknown as { __navChanges: string[] };
      w.__navChanges = [];
      let hidden = header.className.includes("-translate-y-full");
      new MutationObserver(() => {
        const now = header.className.includes("-translate-y-full");
        if (now !== hidden) w.__navChanges.push(now ? "hide" : "show");
        hidden = now;
      }).observe(header, { attributes: true, attributeFilter: ["class"] });
    });
    const changes = () =>
      page.evaluate(() => (window as unknown as { __navChanges: string[] }).__navChanges);
    // Smooth scrolling keeps easing after the last wheel event; the flicker happened in that tail,
    // so wait until the page has completely stopped moving before checking.
    const waitForScrollToSettle = () =>
      page.evaluate(
        () =>
          new Promise<void>((resolve) => {
            let last = window.scrollY;
            let stableFrames = 0;
            const check = () => {
              stableFrames = window.scrollY === last ? stableFrames + 1 : 0;
              last = window.scrollY;
              if (stableFrames >= 30) resolve(); // ~0.5s without movement
              else requestAnimationFrame(check);
            };
            requestAnimationFrame(check);
          }),
      );

    await page.mouse.move(600, 400);
    for (let i = 0; i < 25; i++) {
      await page.mouse.wheel(0, 120);
      await page.waitForTimeout(100);
    }
    await waitForScrollToSettle();
    expect(await changes()).toEqual(["hide"]); // exactly one change: no flicker

    for (let i = 0; i < 4; i++) {
      await page.mouse.wheel(0, -120);
      await page.waitForTimeout(100);
    }
    await waitForScrollToSettle();
    expect(await changes()).toEqual(["hide", "show"]);
  });
});

test.describe("contact form", () => {
  // Fills every required field with valid values.
  async function fillValid(page: Page) {
    await page.getByLabel("Name").fill("Test Person");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Where does the admin pile up?").fill("Quotes live in three spreadsheets.");
    await page.getByLabel(/I agree that Nimbrial may use these details/).check();
  }
  const submit = (page: Page) => page.getByRole("button", { name: "Request a discovery call" }).click();
  // True when src/lib/contact.ts has a Formspree form ID.
  const isConnected = async (page: Page) =>
    ((await page.locator("form").getAttribute("action")) ?? "").startsWith("https://formspree.io/f/");

  test("every Book a discovery call button opens the contact page", async ({ page, isMobile }) => {
    await page.goto("/");
    await page.locator("main").getByRole("link", { name: /Book a discovery call/ }).first().click();
    await expect(page).toHaveURL(/\/contact\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Book a discovery call");
    if (!isMobile) {
      await page.goto("/services/");
      await page.getByRole("banner").getByRole("link", { name: /Book a discovery call/ }).click();
      await expect(page).toHaveURL(/\/contact\/$/);
    }
  });

  test("required fields are enforced before anything is sent", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (r) => r.url().includes("formspree.io") && requests.push(r.url()));
    await page.goto("/contact/");
    await submit(page);
    expect(await page.getByLabel("Name").evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
    await page.getByLabel("Name").fill("Test Person");
    await page.getByLabel("Email").fill("not-an-email");
    await submit(page);
    expect(await page.getByLabel("Email").evaluate((el: HTMLInputElement) => el.validity.typeMismatch)).toBe(true);
    expect(requests).toEqual([]);
  });

  test("a bot filling the hidden field is silently dropped", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (r) => r.url().includes("formspree.io") && requests.push(r.url()));
    await page.goto("/contact/");
    await fillValid(page);
    await page.locator("#cf-website").fill("http://spam.example", { force: true });
    await submit(page);
    await expect(page.getByRole("status")).toContainText("your request is in");
    expect(requests).toEqual([]);
  });

  test("when not yet connected, visitors are pointed to the email address", async ({ page }) => {
    await page.goto("/contact/");
    test.skip(await isConnected(page), "form is connected to Formspree");
    await fillValid(page);
    await submit(page);
    await expect(page.locator("form").getByRole("alert")).toContainText("develop@nimbrial.net");
  });

  test("a successful submission sends every field and confirms", async ({ page }) => {
    await page.goto("/contact/");
    test.skip(!(await isConnected(page)), "form not connected to Formspree yet");
    let sent: string | null = null;
    // Never hit the real service from tests: answer like Formspree does.
    await page.route("https://formspree.io/**", async (route) => {
      sent = route.request().postData();
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    });
    await fillValid(page);
    await submit(page);
    await expect(page.getByRole("status")).toContainText("your request is in");
    for (const value of ["Test Person", "test@example.com", "Quotes live in three spreadsheets.", "Not sure yet"]) {
      expect(sent).toContain(value);
    }
    expect(sent).not.toContain('name="website"');
  });

  test("a rejected submission shows the reason and keeps what was typed", async ({ page }) => {
    await page.goto("/contact/");
    test.skip(!(await isConnected(page)), "form not connected to Formspree yet");
    await page.route("https://formspree.io/**", (route) =>
      route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({ errors: [{ message: "should be an email" }] }),
      }),
    );
    await fillValid(page);
    await submit(page);
    await expect(page.locator("form").getByRole("alert")).toContainText("should be an email");
    await expect(page.getByLabel("Name")).toHaveValue("Test Person");
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

test.describe("security", () => {
  test("every page has a strict, hash-based Content-Security-Policy", async ({ request }) => {
    const { createHash } = await import("node:crypto");
    for (const { path } of PAGES) {
      const html = await (await request.get(path)).text();
      const policy = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1];
      expect(policy, `${path} has a CSP meta tag`).toBeTruthy();
      const directives = Object.fromEntries(
        policy!.split(";").map((d) => {
          const [name, ...sources] = d.trim().split(/\s+/);
          return [name, sources];
        }),
      );
      expect(directives["default-src"]).toEqual(["'self'"]);
      expect(directives["object-src"]).toEqual(["'none'"]);
      // Scripts: never blanket-allowed, and every inline script on the page is explicitly hashed.
      const scriptSrc = directives["script-src"];
      expect(scriptSrc).not.toContain("'unsafe-inline'");
      expect(scriptSrc).not.toContain("'unsafe-eval'");
      const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
      expect(inline.length).toBeGreaterThan(0);
      for (const body of inline) {
        const hash = `'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`;
        expect(scriptSrc, `${path}: inline script is allowed by hash`).toContain(hash);
      }
      // The policy must come before any script, or it won't apply to them.
      expect(html.indexOf("Content-Security-Policy")).toBeLessThan(html.indexOf("<script"));
    }
  });

  test("pages run with no Content-Security-Policy violations", async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __cspViolations: string[] };
      w.__cspViolations = [];
      document.addEventListener("securitypolicyviolation", (e) =>
        w.__cspViolations.push(`${e.violatedDirective}: ${e.blockedURI || "inline"}`),
      );
    });
    for (const { path } of PAGES) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await scrollThrough(page);
      const violations = await page.evaluate(() => (window as unknown as { __cspViolations: string[] }).__cspViolations);
      expect(violations, `${path} CSP violations`).toEqual([]);
    }
  });

  test("an injected inline script is blocked", async ({ page }) => {
    await page.goto("/");
    // Simulates an XSS payload: a script element added with code that isn't in the hash list.
    const ran = await page.evaluate(async () => {
      const w = window as unknown as { __injected?: boolean };
      const s = document.createElement("script");
      s.textContent = "window.__injected = true;";
      document.head.appendChild(s);
      await new Promise((r) => setTimeout(r, 100));
      return w.__injected === true;
    });
    expect(ran).toBe(false);
  });

  test("security headers from render.yaml are sent on every page", async ({ request }) => {
    for (const { path } of [...PAGES, { path: "/this-page-does-not-exist/" }]) {
      const h = (await request.get(path)).headers();
      expect(h["content-security-policy"], path).toContain("frame-ancestors 'none'");
      expect(h["x-frame-options"], path).toBe("DENY");
      expect(h["strict-transport-security"], path).toContain("max-age=31536000");
      expect(h["x-content-type-options"], path).toBe("nosniff");
      expect(h["referrer-policy"], path).toBe("strict-origin-when-cross-origin");
      expect(h["permissions-policy"], path).toContain("camera=()");
      expect(h["cross-origin-opener-policy"], path).toBe("same-origin");
    }
  });

  test("the site cannot be framed by another page (clickjacking)", async ({ page, baseURL }) => {
    await page.setContent(`<iframe id="f" src="${baseURL}/" width="800" height="600"></iframe>`);
    await page.waitForTimeout(1500);
    const frame = page.frame({ url: (u) => u.href.startsWith(baseURL!) });
    // A blocked frame never gets the page's content.
    const heading = frame ? await frame.locator("h1").count().catch(() => 0) : 0;
    expect(heading).toBe(0);
  });

  test("Render builds with the same Node version as CI", async () => {
    const { readFileSync } = await import("node:fs");
    const nvmrc = readFileSync(".nvmrc", "utf8").trim();
    const renderNode = readFileSync("render.yaml", "utf8").match(/key: NODE_VERSION\s+value: "?([^"\s]+)"?/)?.[1];
    expect(renderNode).toBe(nvmrc);
  });
});
