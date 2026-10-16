import { useRef, type ComponentPropsWithRef } from "react";

type Props = Omit<ComponentPropsWithRef<"button">, "onClick"> & {
  onActivate(): void;
};

// Chromium/WebViews can suppress a compatibility click after a native scroll or
// multi-touch sequence. Use a valid pointer release; keep native keyboard/AT clicks.
export function TouchButton({ onActivate, ...props }: Props) {
  const start = useRef<{ id: number; x: number; y: number } | null>(null);
  return (
    <button
      {...props}
      onPointerDown={(event) => {
        if (event.currentTarget.disabled || event.button !== 0) return;
        start.current = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerUp={(event) => {
        const point = start.current;
        start.current = null;
        if (event.currentTarget.disabled) return;
        if (!point || point.id !== event.pointerId) return;
        const box = event.currentTarget.getBoundingClientRect();
        if (
          Math.hypot(event.clientX - point.x, event.clientY - point.y) > 8 ||
          event.clientX < box.left ||
          event.clientX > box.right ||
          event.clientY < box.top ||
          event.clientY > box.bottom
        )
          return;
        event.preventDefault();
        if (event.pointerType === "touch") {
          // Closing a sheet removes this button before the browser emits its
          // compatibility click. Consume that click before it hits a link below.
          // A new pointerdown clears the guard so the next real tap stays valid.
          const clear = () => {
            document.removeEventListener("click", consume, true);
            document.removeEventListener("pointerdown", clear, true);
            window.clearTimeout(timer);
          };
          const consume = (click: MouseEvent) => {
            if (click.detail > 0) {
              click.preventDefault();
              click.stopImmediatePropagation();
            }
            clear();
          };
          const timer = window.setTimeout(clear, 600);
          document.addEventListener("click", consume, true);
          document.addEventListener("pointerdown", clear, true);
        }
        onActivate();
      }}
      onPointerCancel={() => {
        start.current = null;
      }}
      onLostPointerCapture={() => {
        start.current = null;
      }}
      onClick={(event) => {
        if (event.detail === 0 || !("PointerEvent" in window)) onActivate();
      }}
    />
  );
}
