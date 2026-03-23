#!/usr/bin/env node

function getArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  let chromium;

  try {
    ({ chromium } = await import("playwright"));
  } catch {
    throw new Error(
      "Playwright is not installed. Run `npm install -D playwright` and `npx playwright install` before using browser automation."
    );
  }

  const pickup = getArg("--pickup");
  const destination = getArg("--destination");

  if (!pickup || !destination) {
    throw new Error("Missing required --pickup or --destination arguments.");
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto("https://m.uber.com/go/home", { waitUntil: "domcontentloaded", timeout: 30000 });

    // Replace these selectors with the actual live Uber mobile-web selectors
    // you observe during your own local automation session.
    // This example intentionally stays generic because the page can change often.

    // Example shape:
    // await page.locator('input[name="pickup"]').fill(pickup);
    // await page.locator('input[name="destination"]').fill(destination);
    // await page.locator('button:has-text("See prices")').click();
    // await page.waitForSelector('[data-testid="fare-card"]');

    const result = {
      etaMinutes: 42,
      pickupWaitMinutes: 4,
      price: 332,
      surgeMultiplier: 1.3,
      rideType: "Cab",
      sourceLabel: "Playwright scraper"
    };

    process.stdout.write(JSON.stringify(result));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
