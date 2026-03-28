export const MOCK_SCENARIO_MODE = process.env.MOCK_SCENARIO_MODE !== "0";

export function getRideScenarioTime() {
  return new Date("2026-03-27T09:05:00+05:30");
}

export function getFoodScenarioTime() {
  return new Date("2026-03-27T20:15:00+05:30");
}
