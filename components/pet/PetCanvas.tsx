// components/pet/PetCanvas.tsx

"use client";

import { useEffect, useRef, memo } from "react";
import { PetState } from "@/lib/petUtils";

interface PetCanvasProps {
  state: PetState;
  size?: number;
}

type DrawFn = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

const DRAWINGS: Record<PetState, DrawFn> = {
  happy: (ctx, w, h) => {
    const cx = w / 2, cy = h / 2;

    // Тело
    ctx.fillStyle = "#97C459";
    ctx.beginPath(); ctx.arc(cx, cy, w * 0.34, 0, Math.PI * 2); ctx.fill();

    // Блик
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath(); ctx.ellipse(cx - w*0.1, cy - h*0.15, w*0.12, h*0.08, -0.5, 0, Math.PI*2); ctx.fill();

    // Уши
    ctx.fillStyle = "#7DB83A";
    ctx.beginPath(); ctx.ellipse(cx - w*0.28, cy - h*0.28, w*0.08, h*0.12, -0.4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + w*0.28, cy - h*0.28, w*0.08, h*0.12, 0.4, 0, Math.PI*2); ctx.fill();
    // Внутри уха
    ctx.fillStyle = "#C0DD97";
    ctx.beginPath(); ctx.ellipse(cx - w*0.28, cy - h*0.28, w*0.04, h*0.07, -0.4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + w*0.28, cy - h*0.28, w*0.04, h*0.07, 0.4, 0, Math.PI*2); ctx.fill();

    // Глаза
    ctx.fillStyle = "#2C5A0E";
    ctx.beginPath(); ctx.arc(cx - w*0.12, cy - h*0.07, w*0.055, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + w*0.12, cy - h*0.07, w*0.055, 0, Math.PI*2); ctx.fill();
    // Блик глаза
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath(); ctx.arc(cx - w*0.10, cy - h*0.09, w*0.018, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + w*0.14, cy - h*0.09, w*0.018, 0, Math.PI*2); ctx.fill();

    // Улыбка
    ctx.strokeStyle = "#2C5A0E"; ctx.lineWidth = w * 0.022; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(cx, cy + h*0.04, w*0.13, 0.1*Math.PI, 0.9*Math.PI); ctx.stroke();

    // Щёчки
    ctx.fillStyle = "rgba(255,150,100,0.25)";
    ctx.beginPath(); ctx.ellipse(cx - w*0.2, cy + h*0.03, w*0.07, h*0.04, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + w*0.2, cy + h*0.03, w*0.07, h*0.04, 0, 0, Math.PI*2); ctx.fill();

    // Хвост
    ctx.fillStyle = "#7DB83A";
    ctx.beginPath(); ctx.ellipse(cx, cy + h*0.42, w*0.12, h*0.06, 0, 0, Math.PI*2); ctx.fill();

    // Звёздочки
    ctx.fillStyle = "#FAC775";
    const stars = [[cx - w*0.42, cy - h*0.25], [cx + w*0.42, cy - h*0.2], [cx + w*0.38, cy + h*0.1]];
    stars.forEach(([sx, sy]) => {
      ctx.beginPath(); ctx.arc(sx, sy, w*0.032, 0, Math.PI*2); ctx.fill();
    });
  },

  neutral: (ctx, w, h) => {
    const cx = w / 2, cy = h / 2;

    ctx.fillStyle = "#85B7EB";
    ctx.beginPath(); ctx.arc(cx, cy, w * 0.34, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath(); ctx.ellipse(cx - w*0.1, cy - h*0.15, w*0.12, h*0.08, -0.5, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = "#5A8FBF";
    ctx.beginPath(); ctx.ellipse(cx - w*0.28, cy - h*0.28, w*0.08, h*0.12, -0.4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + w*0.28, cy - h*0.28, w*0.08, h*0.12, 0.4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#B5D4F4";
    ctx.beginPath(); ctx.ellipse(cx - w*0.28, cy - h*0.28, w*0.04, h*0.07, -0.4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + w*0.28, cy - h*0.28, w*0.04, h*0.07, 0.4, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = "#0C447C";
    ctx.beginPath(); ctx.arc(cx - w*0.12, cy - h*0.07, w*0.05, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + w*0.12, cy - h*0.07, w*0.05, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath(); ctx.arc(cx - w*0.10, cy - h*0.09, w*0.016, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + w*0.14, cy - h*0.09, w*0.016, 0, Math.PI*2); ctx.fill();

    ctx.strokeStyle = "#0C447C"; ctx.lineWidth = w*0.022; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(cx - w*0.1, cy + h*0.1); ctx.lineTo(cx + w*0.1, cy + h*0.1); ctx.stroke();

    ctx.fillStyle = "#5A8FBF";
    ctx.beginPath(); ctx.ellipse(cx, cy + h*0.42, w*0.1, h*0.055, 0, 0, Math.PI*2); ctx.fill();
  },

  sad: (ctx, w, h) => {
    const cx = w / 2, cy = h / 2;

    ctx.fillStyle = "#EF9F27";
    ctx.beginPath(); ctx.arc(cx, cy, w * 0.34, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath(); ctx.ellipse(cx - w*0.1, cy - h*0.15, w*0.12, h*0.08, -0.5, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = "#C07810";
    ctx.beginPath(); ctx.ellipse(cx - w*0.28, cy - h*0.24, w*0.08, h*0.12, -0.6, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + w*0.28, cy - h*0.24, w*0.08, h*0.12, 0.6, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#FAC775";
    ctx.beginPath(); ctx.ellipse(cx - w*0.28, cy - h*0.24, w*0.04, h*0.07, -0.6, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + w*0.28, cy - h*0.24, w*0.04, h*0.07, 0.6, 0, Math.PI*2); ctx.fill();

    // Нахмуренные брови
    ctx.strokeStyle = "#633806"; ctx.lineWidth = w*0.022; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(cx - w*0.18, cy - h*0.16); ctx.lineTo(cx - w*0.06, cy - h*0.12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + w*0.18, cy - h*0.16); ctx.lineTo(cx + w*0.06, cy - h*0.12); ctx.stroke();

    ctx.fillStyle = "#633806";
    ctx.beginPath(); ctx.ellipse(cx - w*0.12, cy - h*0.05, w*0.05, h*0.045, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + w*0.12, cy - h*0.05, w*0.05, h*0.045, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.beginPath(); ctx.arc(cx - w*0.10, cy - h*0.07, w*0.016, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + w*0.14, cy - h*0.07, w*0.016, 0, Math.PI*2); ctx.fill();

    // Грустный рот
    ctx.strokeStyle = "#633806"; ctx.lineWidth = w*0.022;
    ctx.beginPath(); ctx.arc(cx, cy + h*0.2, w*0.1, Math.PI*1.15, Math.PI*1.85); ctx.stroke();

    // Слёзки
    ctx.fillStyle = "#85B7EB";
    ctx.beginPath(); ctx.ellipse(cx - w*0.16, cy + h*0.05, w*0.022, h*0.035, 0.2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + w*0.16, cy + h*0.05, w*0.022, h*0.035, -0.2, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = "#C07810";
    ctx.beginPath(); ctx.ellipse(cx, cy + h*0.42, w*0.1, h*0.055, 0, 0, Math.PI*2); ctx.fill();
  },

  sick: (ctx, w, h) => {
    const cx = w / 2, cy = h / 2 + h * 0.1;

    // Тело лежит (эллипс)
    ctx.fillStyle = "#F09595";
    ctx.beginPath(); ctx.ellipse(cx, cy, w*0.38, h*0.28, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.beginPath(); ctx.ellipse(cx - w*0.1, cy - h*0.1, w*0.12, h*0.06, -0.5, 0, Math.PI*2); ctx.fill();

    // Уши
    ctx.fillStyle = "#C06060";
    ctx.beginPath(); ctx.ellipse(cx - w*0.32, cy - h*0.18, w*0.07, h*0.1, -0.7, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + w*0.32, cy - h*0.18, w*0.07, h*0.1, 0.7, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#F7C1C1";
    ctx.beginPath(); ctx.ellipse(cx - w*0.32, cy - h*0.18, w*0.035, h*0.055, -0.7, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + w*0.32, cy - h*0.18, w*0.035, h*0.055, 0.7, 0, Math.PI*2); ctx.fill();

    // Глаза — крестики
    ctx.strokeStyle = "#A32D2D"; ctx.lineWidth = w*0.02; ctx.lineCap = "round";
    [[-0.12, -0.07],[0.12, -0.07]].forEach(([dx,dy]) => {
      const ex = cx+dx*w, ey = cy+dy*h, r = w*0.04;
      ctx.beginPath(); ctx.moveTo(ex-r,ey-r); ctx.lineTo(ex+r,ey+r); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ex+r,ey-r); ctx.lineTo(ex-r,ey+r); ctx.stroke();
    });

    // Рот
    ctx.strokeStyle = "#A32D2D"; ctx.lineWidth = w*0.02;
    ctx.beginPath(); ctx.moveTo(cx-w*0.08, cy+h*0.07); ctx.quadraticCurveTo(cx, cy+h*0.03, cx+w*0.08, cy+h*0.07); ctx.stroke();

    // Хвост поджат
    ctx.fillStyle = "#C06060";
    ctx.beginPath(); ctx.ellipse(cx+w*0.35, cy+h*0.18, w*0.07, h*0.04, 0.5, 0, Math.PI*2); ctx.fill();

    // Звёздочки над головой (удар)
    ctx.fillStyle = "#EF9F27";
    const starPos = [[cx-w*0.15,cy-h*0.35],[cx,cy-h*0.42],[cx+w*0.15,cy-h*0.35]];
    starPos.forEach(([sx,sy]) => {
      ctx.beginPath(); ctx.arc(sx, sy, w*0.028, 0, Math.PI*2); ctx.fill();
    });
    ctx.fillStyle = "#FAC775";
    starPos.forEach(([sx,sy]) => {
      ctx.beginPath(); ctx.arc(sx, sy, w*0.012, 0, Math.PI*2); ctx.fill();
    });

    // Термометр
    ctx.fillStyle = "#E24B4A";
    ctx.beginPath(); ctx.roundRect(cx+w*0.2, cy-h*0.05, w*0.06, h*0.18, [4,4,8,8]); ctx.fill();
    ctx.fillStyle = "#F7C1C1";
    ctx.beginPath(); ctx.roundRect(cx+w*0.22, cy-h*0.03, w*0.02, h*0.1, 2); ctx.fill();
  },
};

export const PetCanvas = memo(({ state, size = 120 }: PetCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, size, size);
    DRAWINGS[state](ctx, size, size);
  }, [state, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      aria-label={`Питомец: ${state}`}
    />
  );
});

PetCanvas.displayName = "PetCanvas";