import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Canvas, PencilBrush, IText } from "fabric";
import {
  Pen, Type, Eraser, Minus, Circle, Square,
  Undo2, Trash2, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type Tool = "pen" | "text" | "eraser";

const COLORS = ["#ffffff", "#e53935", "#ffb300", "#43a047", "#1e88e5", "#ab47bc"];
const SIZES = [2, 5, 10];

export interface WhiteboardHandle {
  clear: () => void;
}

interface Props {
  className?: string;
}

export const Whiteboard = forwardRef<WhiteboardHandle, Props>(({ className }, ref) => {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#ffffff");
  const [size, setSize] = useState(5);
  const historyRef = useRef<string[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  useImperativeHandle(ref, () => ({
    clear: () => fabricRef.current?.clear(),
  }));

  // Init fabric canvas
  useEffect(() => {
    if (!canvasEl.current || !containerRef.current) return;
    const { offsetWidth: w, offsetHeight: h } = containerRef.current;

    const fc = new Canvas(canvasEl.current, {
      width: w,
      height: h,
      backgroundColor: "#111111",
      isDrawingMode: true,
    });

    const brush = new PencilBrush(fc);
    brush.color = "#ffffff";
    brush.width = 5;
    fc.freeDrawingBrush = brush;

    fc.on("path:created", () => {
      historyRef.current.push(JSON.stringify(fc.toJSON()));
      setCanUndo(historyRef.current.length > 0);
    });

    fabricRef.current = fc;
    return () => { fc.dispose(); fabricRef.current = null; };
  }, []);

  // Sync tool/color/size to fabric
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    if (tool === "pen") {
      fc.isDrawingMode = true;
      const brush = new PencilBrush(fc);
      brush.color = color;
      brush.width = size;
      fc.freeDrawingBrush = brush;
    } else if (tool === "eraser") {
      fc.isDrawingMode = true;
      const brush = new PencilBrush(fc);
      brush.color = "#111111";
      brush.width = size * 3;
      fc.freeDrawingBrush = brush;
    } else if (tool === "text") {
      fc.isDrawingMode = false;
    }
  }, [tool, color, size]);

  function addText() {
    const fc = fabricRef.current;
    if (!fc) return;
    setTool("text");
    fc.isDrawingMode = false;
    const text = new IText("Type here...", {
      left: 60, top: 80,
      fill: color,
      fontSize: 20,
      fontFamily: "Inter, sans-serif",
    });
    fc.add(text);
    fc.setActiveObject(text);
    text.enterEditing();
    fc.renderAll();
    historyRef.current.push(JSON.stringify(fc.toJSON()));
    setCanUndo(true);
  }

  function undo() {
    const fc = fabricRef.current;
    if (!fc || historyRef.current.length === 0) return;
    historyRef.current.pop();
    const prev = historyRef.current[historyRef.current.length - 1];
    if (prev) {
      fc.loadFromJSON(JSON.parse(prev), () => fc.renderAll());
    } else {
      fc.clear();
      fc.backgroundColor = "#111111";
      fc.renderAll();
    }
    setCanUndo(historyRef.current.length > 0);
  }

  function clear() {
    const fc = fabricRef.current;
    if (!fc) return;
    fc.clear();
    fc.backgroundColor = "#111111";
    fc.renderAll();
    historyRef.current = [];
    setCanUndo(false);
  }

  function download() {
    const fc = fabricRef.current;
    if (!fc) return;
    const url = fc.toDataURL({ format: "png", multiplier: 2 });
    const a = document.createElement("a");
    a.href = url;
    a.download = "whiteboard.png";
    a.click();
  }

  return (
    <div className={cn("flex flex-col bg-[#111111] rounded-xl overflow-hidden border border-white/5", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 bg-[#1a1a1a] border-b border-white/5 flex-wrap">
        {/* Tools */}
        <div className="flex items-center gap-0.5 mr-2">
          <ToolBtn active={tool === "pen"} onClick={() => setTool("pen")} title="Pen">
            <Pen className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn active={tool === "text"} onClick={addText} title="Text">
            <Type className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn active={tool === "eraser"} onClick={() => setTool("eraser")} title="Eraser">
            <Eraser className="w-3.5 h-3.5" />
          </ToolBtn>
        </div>

        {/* Color palette */}
        <div className="flex items-center gap-1 mr-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                "w-5 h-5 rounded-full border-2 transition-transform",
                color === c ? "border-white scale-125" : "border-transparent"
              )}
              style={{ background: c }}
            />
          ))}
        </div>

        {/* Stroke size */}
        <div className="flex items-center gap-1 mr-auto">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={cn(
                "w-6 h-6 rounded flex items-center justify-center transition-colors",
                size === s ? "bg-white/20" : "hover:bg-white/10"
              )}
              title={`Size ${s}`}
            >
              <div
                className="rounded-full bg-white"
                style={{ width: s + 2, height: s + 2 }}
              />
            </button>
          ))}
        </div>

        {/* Actions */}
        <ToolBtn onClick={undo} disabled={!canUndo} title="Undo">
          <Undo2 className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={download} title="Save as PNG">
          <Download className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={clear} title="Clear" className="text-red-400 hover:bg-red-500/10">
          <Trash2 className="w-3.5 h-3.5" />
        </ToolBtn>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 relative" style={{ minHeight: 0 }}>
        <canvas ref={canvasEl} />
      </div>
    </div>
  );
});
Whiteboard.displayName = "Whiteboard";

function ToolBtn({
  children, active, onClick, disabled, title, className,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "w-7 h-7 rounded flex items-center justify-center transition-colors disabled:opacity-30",
        active ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10 hover:text-white",
        className
      )}
    >
      {children}
    </button>
  );
}
