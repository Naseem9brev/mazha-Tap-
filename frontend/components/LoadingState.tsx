"use client";

export function LoadingState({ message }: { message?: string }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-[1.5rem] border border-stone-200 bg-white/70 p-8 text-center">
      <div className="relative">
        <div className="h-14 w-14 rounded-full border-4 border-emerald-950/15 border-t-emerald-950 animate-spin" />
      </div>
      <div>
        <p className="font-lora text-2xl font-black text-stone-950">{message ?? "Checking the skies..."}</p>
        <p className="mt-2 text-sm font-semibold text-stone-500">Fetching weather for your plantation</p>
      </div>
    </div>
  );
}
