import express from "express";
import next from "next";
import { getRideAssistantState } from "@/lib/rides/proactive";
import { recordConfirmation, recordDismissal, recordEdits } from "@/lib/rides/memory";
import type { RideConfirmationPayload, RideDismissalPayload } from "@/lib/rides/types";

const port = Number(process.env.PORT ?? 3000);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, hostname: "localhost", port });
const handle = app.getRequestHandler();

async function main() {
  await app.prepare();
  const server = express();
  server.use(express.json());

  server.get("/api/ride-assistant", async (_req, res) => {
    res.json(await getRideAssistantState());
  });

  server.post("/api/ride-assistant/confirm", async (req, res) => {
    const {
      platform,
      rideType,
      pickup,
      destination,
      suggestedLeaveAt,
      previousPickup,
      previousDestination,
      previousSuggestedLeaveAt
    } = (req.body ?? {}) as RideConfirmationPayload & {
      previousPickup: string;
      previousDestination: string;
      previousSuggestedLeaveAt: string;
    };

    await recordEdits({
      pickup,
      destination,
      suggestedLeaveAt,
      previousPickup,
      previousDestination,
      previousSuggestedLeaveAt
    });
    await recordConfirmation({
      platform,
      rideType,
      pickup,
      destination,
      suggestedLeaveAt
    });

    res.json({
      status: "confirmed",
      confirmedAt: new Date().toISOString(),
      platform,
      rideType,
      pickup,
      destination,
      suggestedLeaveAt
    });
  });

  server.post("/api/ride-assistant/dismiss", async (req, res) => {
    const { pickup, destination, suggestedLeaveAt, reason } = (req.body ?? {}) as RideDismissalPayload;
    await recordDismissal({
      pickup,
      destination,
      suggestedLeaveAt,
      reason
    });
    res.json({
      status: "dismissed",
      dismissedAt: new Date().toISOString(),
      pickup,
      destination
    });
  });

  server.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  server.all("*", (req, res) => handle(req, res));

  server.listen(port, () => {
    console.log(`Act First running on http://localhost:${port}`);
  });
}

main().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
