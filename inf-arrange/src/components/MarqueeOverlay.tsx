import { useCanvasStore } from "@/store/canvas";

export function MarqueeOverlay() {
  const marqueeRect = useCanvasStore((s) => s.marqueeRect);
  const viewport = useCanvasStore((s) => (s.marqueeRect ? s.viewport : null));

  if (!marqueeRect || !viewport) return null;

  const left = marqueeRect.x * viewport.k + viewport.x;
  const top = marqueeRect.y * viewport.k + viewport.y;
  const width = marqueeRect.w * viewport.k;
  const height = marqueeRect.h * viewport.k;

  return (
    <div
      className="cs-marquee"
      style={{
        left,
        top,
        width,
        height,
      }}
    />
  );
}
