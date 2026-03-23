export type RidePlatform = "Uber" | "Ola" | "Rapido";
export type RideType = "Auto" | "Bike" | "Cab";

export interface RideHistoryEntry {
  id: string;
  platform: RidePlatform;
  rideType: RideType;
  pickup: string;
  destination: string;
  pickupAt: string;
  dropAt: string;
  fare: number;
  durationMins: number;
}

export const rideHistory: RideHistoryEntry[] = [
  { id: "r1", platform: "Uber", rideType: "Cab", pickup: "Home - Koramangala 6th Block", destination: "ActFirst HQ - HSR Layout", pickupAt: "2026-03-16T09:14:00+05:30", dropAt: "2026-03-16T09:42:00+05:30", fare: 281, durationMins: 28 },
  { id: "r2", platform: "Uber", rideType: "Cab", pickup: "Home - Koramangala 6th Block", destination: "ActFirst HQ - HSR Layout", pickupAt: "2026-03-17T09:12:00+05:30", dropAt: "2026-03-17T09:39:00+05:30", fare: 268, durationMins: 27 },
  { id: "r3", platform: "Ola", rideType: "Auto", pickup: "Home - Koramangala 6th Block", destination: "ActFirst HQ - HSR Layout", pickupAt: "2026-03-18T09:17:00+05:30", dropAt: "2026-03-18T09:52:00+05:30", fare: 214, durationMins: 35 },
  { id: "r4", platform: "Uber", rideType: "Cab", pickup: "Home - Koramangala 6th Block", destination: "ActFirst HQ - HSR Layout", pickupAt: "2026-03-19T09:16:00+05:30", dropAt: "2026-03-19T09:47:00+05:30", fare: 289, durationMins: 31 },
  { id: "r5", platform: "Rapido", rideType: "Bike", pickup: "Home - Koramangala 6th Block", destination: "ActFirst HQ - HSR Layout", pickupAt: "2026-03-20T09:13:00+05:30", dropAt: "2026-03-20T09:36:00+05:30", fare: 142, durationMins: 23 },
  { id: "r6", platform: "Uber", rideType: "Cab", pickup: "Home - Koramangala 6th Block", destination: "Pulse Fit Gym - Indiranagar", pickupAt: "2026-03-14T10:02:00+05:30", dropAt: "2026-03-14T10:26:00+05:30", fare: 196, durationMins: 24 },
  { id: "r7", platform: "Uber", rideType: "Cab", pickup: "ActFirst HQ - HSR Layout", destination: "Home - Koramangala 6th Block", pickupAt: "2026-03-16T18:34:00+05:30", dropAt: "2026-03-16T19:12:00+05:30", fare: 302, durationMins: 38 },
  { id: "r8", platform: "Rapido", rideType: "Bike", pickup: "ActFirst HQ - HSR Layout", destination: "Home - Koramangala 6th Block", pickupAt: "2026-03-17T18:42:00+05:30", dropAt: "2026-03-17T19:06:00+05:30", fare: 158, durationMins: 24 },
  { id: "r9", platform: "Uber", rideType: "Cab", pickup: "ActFirst HQ - HSR Layout", destination: "Home - Koramangala 6th Block", pickupAt: "2026-03-18T18:29:00+05:30", dropAt: "2026-03-18T19:08:00+05:30", fare: 311, durationMins: 39 },
  { id: "r10", platform: "Ola", rideType: "Auto", pickup: "ActFirst HQ - HSR Layout", destination: "Home - Koramangala 6th Block", pickupAt: "2026-03-19T18:37:00+05:30", dropAt: "2026-03-19T19:14:00+05:30", fare: 228, durationMins: 37 },
  { id: "r11", platform: "Uber", rideType: "Cab", pickup: "ActFirst HQ - HSR Layout", destination: "Home - Koramangala 6th Block", pickupAt: "2026-03-20T18:30:00+05:30", dropAt: "2026-03-20T19:02:00+05:30", fare: 298, durationMins: 32 },
  { id: "r12", platform: "Rapido", rideType: "Bike", pickup: "Home - Koramangala 6th Block", destination: "ActFirst HQ - HSR Layout", pickupAt: "2026-03-13T09:18:00+05:30", dropAt: "2026-03-13T09:43:00+05:30", fare: 134, durationMins: 25 }
];
