"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { TapperCardView } from "@/lib/api";
import { TapperCard } from "@/components/TapperCard";
import { Heart, X } from "lucide-react";

interface TapperSwipeStackProps {
  tappers: TapperCardView[];
  activeIndex: number;
  onSwipe: (tapper: TapperCardView, direction: "left" | "right", source: "swipe" | "button") => void;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  x: number;
  y: number;
}

const EMPTY_DRAG: DragState = { isDragging: false, startX: 0, startY: 0, x: 0, y: 0 };
const SWIPE_THRESHOLD = 110;

export function TapperSwipeStack({ tappers, activeIndex, onSwipe }: TapperSwipeStackProps) {
  const [drag, setDrag] = useState<DragState>(EMPTY_DRAG);
  const activeTapper = tappers[activeIndex];
  const visibleCards = tappers.slice(activeIndex, activeIndex + 3);

  const handleChoice = (direction: "left" | "right", source: "swipe" | "button") => {
    if (!activeTapper) return;
    setDrag(EMPTY_DRAG);
    onSwipe(activeTapper, direction, source);
  };

  if (!activeTapper) return null;

  return (
    <section className="space-y-5" role="region" aria-label="Tapper profiles">
      <div
        className="relative mx-auto h-[560px] max-w-md touch-none outline-none"
        tabIndex={0}
        onKeyDown={event => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            handleChoice("left", "button");
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            handleChoice("right", "button");
          }
        }}
        onPointerDown={event => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setDrag({ isDragging: true, startX: event.clientX, startY: event.clientY, x: 0, y: 0 });
        }}
        onPointerMove={event => {
          if (!drag.isDragging) return;
          setDrag(current => ({ ...current, x: event.clientX - current.startX, y: event.clientY - current.startY }));
        }}
        onPointerUp={() => {
          if (!drag.isDragging) return;
          if (drag.x > SWIPE_THRESHOLD) handleChoice("right", "swipe");
          else if (drag.x < -SWIPE_THRESHOLD) handleChoice("left", "swipe");
          else setDrag(EMPTY_DRAG);
        }}
        onPointerCancel={() => setDrag(EMPTY_DRAG)}
      >
        {visibleCards.map((tapper, offset) => {
          const isActive = offset === 0;
          const stackScale = 1 - offset * 0.045;
          const stackTranslate = offset * 14;
          const rotate = isActive ? drag.x / 18 : 0;
          const transform = isActive
            ? `translate(${drag.x}px, ${drag.y}px) rotate(${rotate}deg)`
            : `translateY(${stackTranslate}px) scale(${stackScale})`;

          return (
            <article
              key={tapper.id}
              className="absolute inset-0 transition-transform duration-200 ease-out"
              style={{ transform, zIndex: visibleCards.length - offset }}
            >
              <TapperCard tapper={tapper} isActive={isActive} />
              {isActive && Math.abs(drag.x) > 40 && (
                <div className={`pointer-events-none absolute left-6 top-6 rotate-[-12deg] rounded-xl border-4 px-4 py-2 text-xl font-black uppercase ${drag.x > 0 ? "border-primary text-primary" : "border-destructive text-destructive"}`}>
                  {drag.x > 0 ? "Interested" : "Skip"}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
        <Button type="button" size="lg" variant="outline" onClick={() => handleChoice("left", "button")}>
          <X className="mr-2 h-5 w-5" />Not now
        </Button>
        <Button type="button" size="lg" onClick={() => handleChoice("right", "button")}>
          <Heart className="mr-2 h-5 w-5" />Interested
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">Drag, use arrow keys, or choose a button.</p>
    </section>
  );
}
