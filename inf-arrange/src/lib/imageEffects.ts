import type { ImageEffect, ImageEffectStep } from "@/types";

const cssByEffect: Record<ImageEffect, string> = {
  none: "",
  bw: "grayscale(1)",
  sepia: "sepia(0.85) saturate(1.15)",
  "old-movie": "sepia(0.55) contrast(1.25) brightness(0.92) saturate(0.7)",
  "high-contrast": "contrast(1.65) saturate(1.15)",
  "soft-blur": "blur(1.2px) saturate(0.92)",
  posterize: "contrast(1.55) saturate(1.8)",
  cartoon: "contrast(1.45) saturate(1.8) brightness(1.04)",
  cubist: "contrast(1.35) saturate(1.35) hue-rotate(18deg)",
};

export const IMAGE_EFFECT_OPTIONS: Array<{ value: ImageEffect; label: string }> = [
  { value: "none", label: "None" },
  { value: "bw", label: "Black + white" },
  { value: "sepia", label: "Sepia" },
  { value: "old-movie", label: "Old movie" },
  { value: "high-contrast", label: "High contrast" },
  { value: "soft-blur", label: "Soft blur" },
  { value: "posterize", label: "Posterize" },
  { value: "cartoon", label: "Cartoon-ish" },
  { value: "cubist", label: "Cubist tint" },
];

export function imageEffectToCss(effects: ImageEffectStep[] | undefined): string | undefined {
  const value = (effects ?? [])
    .map((step) => cssByEffect[step.kind])
    .filter(Boolean)
    .join(" ");
  return value || undefined;
}
