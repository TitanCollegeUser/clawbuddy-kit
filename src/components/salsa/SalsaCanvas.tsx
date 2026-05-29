import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from "react";
import { Canvas, PencilBrush, IText, Circle, Group, FabricText } from "fabric";

export type DrawTool = "select" | "draw" | "text" | "eraser";

export interface SalsaCanvasHandle {
  setTool: (t: DrawTool) => void;
  setColor: (c: string) => void;
  setSize: (s: number) => void;
  addFootstep: (count: string, foot: "left" | "right", color: string) => void;
  addPresetPattern: (pattern: string, timing: string) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  download: () => void;
  deleteSelected: () => void;
}

interface Props {
  tool: DrawTool;
  color: string;
  size: number;
  showPath: boolean;
  countsOnFloor: boolean;
  onStepSelect: (count: string | null) => void;
}

// Preset footstep layouts (relative positions)
const PRESETS: Record<string, Array<{ count: string; foot: "left"|"right"; dx: number; dy: number }>> = {
  "Basic Step":      [{ count:"1", foot:"left",  dx:0,   dy:0   }, { count:"2", foot:"right", dx:50,  dy:0   }, { count:"3", foot:"left",  dx:25,  dy:0   }, { count:"5", foot:"right", dx:50,  dy:80  }, { count:"6", foot:"left",  dx:0,   dy:80  }, { count:"7", foot:"right", dx:25,  dy:80  }],
  "Side Step":       [{ count:"1", foot:"left",  dx:0,   dy:0   }, { count:"2", foot:"right", dx:60,  dy:0   }, { count:"3", foot:"left",  dx:30,  dy:0   }, { count:"5", foot:"right", dx:-30, dy:0   }, { count:"6", foot:"left",  dx:-60, dy:0   }, { count:"7", foot:"right", dx:-30, dy:0   }],
  "Cross Body Lead": [{ count:"1", foot:"left",  dx:0,   dy:0   }, { count:"2", foot:"right", dx:0,   dy:-50 }, { count:"3", foot:"left",  dx:50,  dy:-50 }, { count:"5", foot:"right", dx:80,  dy:-20 }, { count:"6", foot:"left",  dx:80,  dy:30  }, { count:"7", foot:"right", dx:40,  dy:30  }],
  "Right Turn":      [{ count:"1", foot:"left",  dx:0,   dy:0   }, { count:"2", foot:"right", dx:40,  dy:-20 }, { count:"3", foot:"left",  dx:60,  dy:-50 }, { count:"5", foot:"right", dx:40,  dy:-80 }, { count:"6", foot:"left",  dx:0,   dy:-60 }, { count:"7", foot:"right", dx:-20, dy:-30 }],
};

export const SalsaCanvas = forwardRef<SalsaCanvasHandle, Props>(
  ({ tool, color, size, showPath, countsOnFloor, onStepSelect }, ref) => {
    const canvasEl = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fc = useRef<Canvas | null>(null);
    const undoStack = useRef<string[]>([]);
    const redoStack = useRef<string[]>([]);
    const stepsRef = useRef<number>(0);

    function saveHistory() {
      if (!fc.current) return;
      undoStack.current.push(JSON.stringify(fc.current.toJSON(["data"])));
      if (undoStack.current.length > 40) undoStack.current.shift();
      redoStack.current = [];
    }

    function applyBrush(canvas: Canvas, t: DrawTool, c: string, s: number) {
      if (t === "draw") {
        canvas.isDrawingMode = true;
        const b = new PencilBrush(canvas);
        b.color = c; b.width = s;
        canvas.freeDrawingBrush = b;
      } else if (t === "eraser") {
        canvas.isDrawingMode = true;
        const b = new PencilBrush(canvas);
        b.color = "#111111"; b.width = s * 4;
        canvas.freeDrawingBrush = b;
      } else {
        canvas.isDrawingMode = false;
      }
    }

    useEffect(() => {
      if (!canvasEl.current || !containerRef.current) return;
      const { offsetWidth: w, offsetHeight: h } = containerRef.current;
      const canvas = new Canvas(canvasEl.current, {
        width: w, height: h,
        backgroundColor: "#111111",
        isDrawingMode: true,
        selection: true,
      });
      applyBrush(canvas, "draw", "#ffffff", 2);

      canvas.on("path:created", saveHistory);
      canvas.on("object:modified", saveHistory);
      canvas.on("selection:created", (e) => {
        const obj = (e as any).selected?.[0];
        const data = (obj as any)?.data;
        if (data?.type === "footstep") onStepSelect(data.count);
        else onStepSelect(null);
      });
      canvas.on("selection:cleared", () => onStepSelect(null));

      fc.current = canvas;

      const ro = new ResizeObserver(() => {
        if (!containerRef.current) return;
        canvas.setWidth(containerRef.current.offsetWidth);
        canvas.setHeight(containerRef.current.offsetHeight);
        canvas.renderAll();
      });
      ro.observe(containerRef.current);
      return () => { ro.disconnect(); canvas.dispose(); fc.current = null; };
    }, []);

    useImperativeHandle(ref, () => ({
      setTool: (t) => fc.current && applyBrush(fc.current, t, color, size),
      setColor: (c) => { if (fc.current?.freeDrawingBrush) fc.current.freeDrawingBrush.color = c; },
      setSize: (s) => { if (fc.current?.freeDrawingBrush) fc.current.freeDrawingBrush.width = s; },

      addFootstep(count, foot, col) {
        const canvas = fc.current; if (!canvas) return;
        const cx = 80 + (stepsRef.current % 5) * 70;
        const cy = 80 + Math.floor(stepsRef.current / 5) * 80;
        stepsRef.current++;

        // Foot circle
        const circle = new Circle({
          radius: 22, fill: foot === "left" ? col + "33" : col + "22",
          stroke: col, strokeWidth: 2, originX: "center", originY: "center",
        });
        // Count label
        const label = new FabricText(count, {
          fontSize: 14, fontWeight: "bold", fill: col,
          fontFamily: "Inter, sans-serif",
          originX: "center", originY: "center",
        });
        // Foot emoji text
        const emoji = new FabricText(foot === "left" ? "L" : "R", {
          fontSize: 9, fill: col + "99",
          fontFamily: "Inter, sans-serif",
          originX: "center", originY: "center",
          top: 12,
        });

        const group = new Group([circle, label, emoji], {
          left: cx, top: cy,
          originX: "center", originY: "center",
          selectable: true, hasControls: true,
          data: { type: "footstep", count, foot },
        } as any);

        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.renderAll();
        saveHistory();
        onStepSelect(count);
      },

      addPresetPattern(pattern, timing) {
        const canvas = fc.current; if (!canvas) return;
        const steps = PRESETS[pattern]; if (!steps) return;
        const baseX = 120, baseY = 200;
        steps.forEach(({ count, foot, dx, dy }) => {
          const circle = new Circle({
            radius: 20, fill: "#e5393522",
            stroke: "#e53935", strokeWidth: 1.5,
            originX: "center", originY: "center",
          });
          const label = new FabricText(count, {
            fontSize: 13, fontWeight: "bold", fill: "#ffffff",
            fontFamily: "Inter, sans-serif",
            originX: "center", originY: "center",
          });
          const group = new Group([circle, label], {
            left: baseX + dx, top: baseY + dy,
            originX: "center", originY: "center",
            selectable: true,
            data: { type: "footstep", count, foot },
          } as any);
          canvas.add(group);
        });
        canvas.renderAll();
        saveHistory();
      },

      undo() {
        const canvas = fc.current; if (!canvas || undoStack.current.length === 0) return;
        redoStack.current.push(JSON.stringify(canvas.toJSON(["data"])));
        const prev = undoStack.current.pop();
        if (prev) canvas.loadFromJSON(JSON.parse(prev)).then(() => canvas.renderAll());
        else { canvas.clear(); canvas.backgroundColor = "#111111"; canvas.renderAll(); }
      },

      redo() {
        const canvas = fc.current; if (!canvas || redoStack.current.length === 0) return;
        undoStack.current.push(JSON.stringify(canvas.toJSON(["data"])));
        const next = redoStack.current.pop()!;
        canvas.loadFromJSON(JSON.parse(next)).then(() => canvas.renderAll());
      },

      clear() {
        const canvas = fc.current; if (!canvas) return;
        saveHistory();
        canvas.clear(); canvas.backgroundColor = "#111111"; canvas.renderAll();
      },

      download() {
        const canvas = fc.current; if (!canvas) return;
        const url = canvas.toDataURL({ format: "png", multiplier: 2 });
        const a = document.createElement("a"); a.href = url; a.download = "whiteboard.png"; a.click();
      },

      deleteSelected() {
        const canvas = fc.current; if (!canvas) return;
        const objs = canvas.getActiveObjects();
        objs.forEach(o => canvas.remove(o));
        canvas.discardActiveObject();
        canvas.renderAll();
        saveHistory();
      },
    }));

    return (
      <div ref={containerRef} className="w-full h-full">
        <canvas ref={canvasEl} />
        {/* Grid overlay hint */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-white/20 pointer-events-none select-none">
          Click count buttons to place footsteps · Drag to reposition
        </div>
      </div>
    );
  }
);
SalsaCanvas.displayName = "SalsaCanvas";
