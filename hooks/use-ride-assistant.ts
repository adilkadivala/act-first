"use client";

import { useEffect, useState } from "react";
import { buildSuggestionDateTime } from "@/lib/rides/date-time";
import type { RideAssistantResponse } from "@/lib/rides/types";

export interface RideFormState {
  pickup: string;
  destination: string;
  suggestedLeaveAt: string;
}

function createFormState(data: RideAssistantResponse): RideFormState {
  return {
    pickup: data.suggestion.pickup,
    destination: data.suggestion.destination,
    suggestedLeaveAt: data.suggestion.suggestedLeaveAt.slice(11, 16)
  };
}

export function useRideAssistant() {
  const [data, setData] = useState<RideAssistantResponse | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<RideFormState>({
    pickup: "",
    destination: "",
    suggestedLeaveAt: ""
  });

  async function loadAssistant() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ride-assistant");
      if (!response.ok) {
        throw new Error(`Failed to load assistant (${response.status})`);
      }
      const json = (await response.json()) as RideAssistantResponse;
      setData(json);
      setForm(createFormState(json));
      setDismissed(false);
      return json;
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load assistant";
      setError(message);
      setData(null);
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAssistant();
  }, []);

  async function confirmRide(platform: string, rideType: string) {
    if (!data) return;
    setSaving(true);
    setConfirmed("pending");

    const response = await fetch("/api/ride-assistant/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform,
        rideType,
        pickup: form.pickup,
        destination: form.destination,
        suggestedLeaveAt: buildSuggestionDateTime(data.currentTime, form.suggestedLeaveAt),
        previousPickup: data.suggestion.pickup,
        previousDestination: data.suggestion.destination,
        previousSuggestedLeaveAt: data.suggestion.suggestedLeaveAt
      })
    });

    const json = await response.json();
    setConfirmed(`${json.platform} ${json.rideType}`);
    setSaving(false);
  }

  async function dismissSuggestion() {
    if (!data) return;
    setSaving(true);

    await fetch("/api/ride-assistant/dismiss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pickup: form.pickup,
        destination: form.destination,
        suggestedLeaveAt: buildSuggestionDateTime(data.currentTime, form.suggestedLeaveAt),
        reason: "Dismissed from dashboard"
      })
    });

    setDismissed(true);
    setSaving(false);
  }

  return {
    data,
    form,
    setForm,
    confirmed,
    dismissed,
    loading,
    error,
    saving,
    confirmRide,
    dismissSuggestion,
    refreshAssistant: loadAssistant
  };
}
