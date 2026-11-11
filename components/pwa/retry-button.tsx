"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Reloads the page the learner tried to open (the offline page is shown in its place). */
export function RetryButton({ label }: { label: string }) {
  return (
    <Button variant="primary" onClick={() => window.location.reload()}>
      <RefreshCw aria-hidden="true" />
      {label}
    </Button>
  );
}
