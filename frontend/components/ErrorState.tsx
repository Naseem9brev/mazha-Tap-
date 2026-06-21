"use client";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  onReset?: () => void;
}

export function ErrorState({ message, onRetry, onReset }: ErrorStateProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <div className="p-4 rounded-xl bg-destructive/10">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <div className="text-center max-w-sm">
        <p className="font-semibold text-foreground">Something went wrong</p>
        <p className="text-sm text-muted-foreground mt-1">{message}</p>
      </div>
      <div className="flex gap-2">
        {onRetry && <Button variant="outline" onClick={onRetry}>Try again</Button>}
        {onReset && <Button variant="ghost" onClick={onReset}>Start over</Button>}
      </div>
    </div>
  );
}
