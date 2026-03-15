// src/components/GuidedTour.tsx
// Interactive guided tour overlay with element highlighting and step-by-step tooltips

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, MapPin } from "lucide-react";

export interface TourStep {
  /** CSS selector of the element to highlight (optional — omit for a centered info card) */
  selector?: string;
  /** Title of the step */
  title: string;
  /** Description/explanation */
  description: string;
  /** Preferred tooltip placement */
  placement?: "top" | "bottom" | "left" | "right";
}

interface GuidedTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
}

export function GuidedTour({ steps, isOpen, onClose }: GuidedTourProps) {
  const [current, setCurrent] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = steps[current];

  // Find and measure the target element
  const measureTarget = useCallback(() => {
    if (!step?.selector) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(step.selector);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
      // Scroll into view if needed
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setTargetRect(null);
    }
  }, [step]);

  useEffect(() => {
    if (!isOpen) return;
    setCurrent(0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    measureTarget();
    const handle = setInterval(measureTarget, 500);
    window.addEventListener("resize", measureTarget);
    return () => {
      clearInterval(handle);
      window.removeEventListener("resize", measureTarget);
    };
  }, [isOpen, current, measureTarget]);

  if (!isOpen || !step) return null;

  const isFirst = current === 0;
  const isLast = current === steps.length - 1;

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      // Centered card
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const padding = 12;
    const placement = step.placement || "bottom";

    switch (placement) {
      case "bottom":
        return {
          position: "fixed",
          top: targetRect.bottom + padding,
          left: Math.max(16, targetRect.left + targetRect.width / 2 - 160),
        };
      case "top":
        return {
          position: "fixed",
          bottom: window.innerHeight - targetRect.top + padding,
          left: Math.max(16, targetRect.left + targetRect.width / 2 - 160),
        };
      case "left":
        return {
          position: "fixed",
          top: targetRect.top + targetRect.height / 2 - 60,
          right: window.innerWidth - targetRect.left + padding,
        };
      case "right":
        return {
          position: "fixed",
          top: targetRect.top + targetRect.height / 2 - 60,
          left: targetRect.right + padding,
        };
      default:
        return {
          position: "fixed",
          top: targetRect.bottom + padding,
          left: Math.max(16, targetRect.left + targetRect.width / 2 - 160),
        };
    }
  };

  const overlay = (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Highlight cutout */}
      {targetRect && (
        <div
          className="absolute border-2 border-blue-400 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.5), 0 0 15px rgba(59,130,246,0.5)",
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={getTooltipStyle()}
        className="w-80 bg-card border border-border rounded-xl shadow-2xl p-4 z-[10000]"
      >
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-[10px] font-medium text-muted-foreground">
              Stap {current + 1} van {steps.length}
            </span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Step progress dots */}
        <div className="flex gap-1 mb-3">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= current ? "bg-blue-500" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <h4 className="text-sm font-semibold mb-1">{step.title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrent((c) => c - 1)}
            disabled={isFirst}
            className="text-xs h-7"
          >
            <ChevronLeft className="h-3 w-3 mr-1" />
            Vorige
          </Button>

          {isLast ? (
            <Button
              size="sm"
              className="text-xs h-7 bg-gradient-to-r from-blue-600 to-teal-600 text-white"
              onClick={onClose}
            >
              Tour afsluiten
            </Button>
          ) : (
            <Button
              size="sm"
              className="text-xs h-7"
              onClick={() => setCurrent((c) => c + 1)}
            >
              Volgende
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
