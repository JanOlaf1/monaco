"use client";

import type { ComponentProps } from "react";
import { Mascot } from "@/components/mascot/mascot";
import { useAdventure } from "@/lib/adventure/hooks";

/** Show the saved avatar outside the collection without changing legacy mascot callers. */
export function ExplorerMascot(props: Omit<ComponentProps<typeof Mascot>, "cosmetics">) {
  const { value, hydrated, readOnly } = useAdventure();
  return <Mascot {...props} cosmetics={hydrated && !readOnly ? value.equipped : undefined} />;
}
