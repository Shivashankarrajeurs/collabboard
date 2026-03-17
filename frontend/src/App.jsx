import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function App() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("black");

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctxRef.current = ctx;

    socket.on("draw", ({ x0, y0, x1, y1, color }) => {
      drawLine(x0, y0, x1, y1, color);
    });

    socket.on("clear", clearCanvas);

    return () => {
      socket.off("draw");
      socket.off("clear");
    };
  }, []);

  useEffect(() => {
    ctxRef.current.strokeStyle = color;
  }, [color]);

  const drawLine = (x0, y0, x1, y1, color) => {
    const ctx = ctxRef.current;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.closePath();
  };

  let prev = useRef({ x: 0, y: 0 });

  const startDrawing = (e) => {
    setDrawing(true);
    prev.current = { x: e.clientX, y: e.clientY };
  };

  const draw = (e) => {
    if (!drawing) return;

    const { x, y } = prev.current;
    const newX = e.clientX;
    const newY = e.clientY;

    drawLine(x, y, newX, newY, color);

    socket.emit("draw", {
      x0: x,
      y0: y,
      x1: newX,
      y1: newY,
      color,
    });

    prev.current = { x: newX, y: newY };
  };

  const stopDrawing = () => {
    setDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleClear = () => {
    clearCanvas();
    socket.emit("clear");
  };

  return (
    <>
      <div style={{ position: "fixed", top: 10, left: 10, zIndex: 10 }}>
        <input
          type="color"
          onChange={(e) => setColor(e.target.value)}
        />
        <button onClick={handleClear}>Clear</button>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </>
  );
}

export default App;