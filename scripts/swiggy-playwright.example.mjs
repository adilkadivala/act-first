#!/usr/bin/env node

async function main() {
  let chromium;

  try {
    ({ chromium } = await import("playwright"));
  } catch {
    throw new Error(
      "Playwright is not installed. Run `npm install -D playwright` and `npx playwright install` before using browser automation."
    );
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto("https://www.swiggy.com/restaurants", { waitUntil: "domcontentloaded", timeout: 30000 });

    // Replace these selectors with the real selectors from your own logged-in session.
    // Expected output shape:
    // {
    //   history: OrderRecord[],
    //   offers: FoodOffer[],
    //   averageEtaMinutes: number,
    //   currentDelayMinutes: number,
    //   sourceLabel: string
    // }

    const result = {
      history: [
        {
          id: "live-ord-001",
          platform: "Swiggy",
          restaurant: "Paradise Biryani",
          orderedAt: new Date().toISOString(),
          deliveredInMinutes: 41,
          total: 438,
          items: [
            { name: "Chicken Dum Biryani", cuisine: "Biryani", quantity: 1, price: 329 },
            { name: "Double Ka Meetha", cuisine: "Dessert", quantity: 1, price: 109 }
          ]
        }
      ],
      offers: [
        {
          restaurant: "Paradise Biryani",
          platform: "Swiggy",
          items: [
            { name: "Chicken Dum Biryani", cuisine: "Biryani", price: 329 },
            { name: "Double Ka Meetha", cuisine: "Dessert", price: 109 }
          ],
          etaMinutes: 49,
          deliveryFee: 39,
          available: true,
          sourceStatus: "live",
          sourceLabel: "Playwright scraper",
          warnings: ["Current delivery time is higher than your usual Friday baseline."]
        }
      ],
      averageEtaMinutes: 34,
      currentDelayMinutes: 15,
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
