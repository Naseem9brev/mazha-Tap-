"use client";

import { AlertTriangle } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  onReset?: () => void;
}

export function ErrorState({ message, onRetry, onReset }: ErrorStateProps) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-[1.5rem] border border-red-200 bg-red-50/70 p-8 text-center">
      <div className="rounded-2xl bg-red-100 p-4">
        <AlertTriangle className="h-8 w-8 text-red-600" />
      </div>
      <div className="max-w-sm">
        <p className="font-lora text-2xl font-black text-stone-950">Something went wrong</p>
        <p className="mt-2 text-sm font-semibold text-stone-600">{message}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {onRetry && (
          <button type="button" onClick={onRetry} className="rounded-full bg-emerald-950 px-4 py-2 text-sm font-black text-amber-50 hover:bg-emerald-900">
            Try again
          </button>
        )}
        {onReset && (
          <button type="button" onClick={onReset} className="rounded-full bg-white px-4 py-2 text-sm font-black text-stone-700 hover:bg-amber-50">
            Start over
          </button>
        )}
      </div>
    </div>
  );
}
