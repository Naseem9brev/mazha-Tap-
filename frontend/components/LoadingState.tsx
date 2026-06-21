"use client";

export function LoadingState({ message }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
      <div className="text-center">
        <p className="font-medium text-foreground">{message ?? "Checking the skies..."}</p>
        <p className="text-sm text-muted-foreground mt-1">Fetching weather for your plantation</p>
      </div>
    </div>
  );
}
