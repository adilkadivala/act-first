"use client";

import { useEffect, useState, useTransition } from "react";
import type { FoodAssistantResponse } from "@/lib/food/types";

export interface FoodEditableState {
  restaurant: string;
  items: string;
  scheduledFor: string;
}

function createEditableState(data: FoodAssistantResponse): FoodEditableState {
  return {
    restaurant: data.suggestion?.restaurant ?? "",
    items: data.suggestion?.items.map((item) => item.name).join(", ") ?? "",
    scheduledFor: data.suggestion?.scheduledFor ?? ""
  };
}

export function useFoodAssistant() {
  const [data, setData] = useState<FoodAssistantResponse | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editable, setEditable] = useState<FoodEditableState>({
    restaurant: "",
    items: "",
    scheduledFor: ""
  });
  const [isPending, startTransition] = useTransition();

  async function load() {
    try {
      setError(null);
      const response = await fetch("/api/food-assistant");
      if (!response.ok) {
        throw new Error(`Food assistant failed to load (${response.status})`);
      }
      const payload = (await response.json()) as FoodAssistantResponse;
      setData(payload);
      setEditable(createEditableState(payload));
      setDismissed(false);
      setConfirmed(false);
      return payload;
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Food assistant failed to load.";
      setError(message);
      setData(null);
      return null;
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function confirm() {
    if (!data?.suggestion) return;
    const suggestion = data.suggestion;

    startTransition(async () => {
      if (editable.restaurant !== suggestion.restaurant) {
        await fetch("/api/food-assistant/edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            suggestionId: data.suggestionId,
            field: "restaurant",
            from: suggestion.restaurant,
            to: editable.restaurant
          })
        });
      }

      const originalItems = suggestion.items.map((item) => item.name).join(", ");
      if (editable.items !== originalItems) {
        await fetch("/api/food-assistant/edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            suggestionId: data.suggestionId,
            field: "items",
            from: originalItems,
            to: editable.items
          })
        });
      }

      if (editable.scheduledFor !== suggestion.scheduledFor) {
        await fetch("/api/food-assistant/edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            suggestionId: data.suggestionId,
            field: "scheduledFor",
            from: suggestion.scheduledFor,
            to: editable.scheduledFor
          })
        });
      }

      await fetch("/api/food-assistant/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggestionId: data.suggestionId,
          restaurant: editable.restaurant,
          items: editable.items
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          scheduledFor: editable.scheduledFor
        })
      });

      setConfirmed(true);
    });
  }

  function dismiss() {
    if (!data) return;
    startTransition(async () => {
      await fetch("/api/food-assistant/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggestionId: data.suggestionId,
          reason: "dismissed-from-dashboard"
        })
      });
      setDismissed(true);
    });
  }

  return {
    data,
    error,
    editable,
    setEditable,
    confirmed,
    dismissed,
    isPending,
    confirm,
    dismiss,
    refresh: load
  };
}
