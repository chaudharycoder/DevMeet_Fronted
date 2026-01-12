import React, { useRef, useEffect, useState, memo } from 'react';
import { Pencil, Square, ArrowRight, Trash2 } from 'lucide-react';

/**
 * Whiteboard Component
 * Handes real-time collaborative drawing with multiple tools (Pencil, Rectangle, Arrow).
 * Uses a dual-canvas system: 
 * - mainCanvas: Stores the permanent drawing.
 * - previewCanvas: Shows the "ghost" shape precisely while dragging.
 */
const Whiteboard = memo(({ socket, role, roomId }) => {
    const [drawingTool, setDrawingTool] = useState('pencil'); // 'pencil', 'rect', 'arrow'
    const mainCanvasRef = useRef(null);
    const previewCanvasRef = useRef(null);
    const isDrawing = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });

    // --- PERSISTENCE HELPERS ---
    const saveToLocal = () => {
        if (!mainCanvasRef.current || !roomId) return;
        const dataUrl = mainCanvasRef.current.toDataURL();
        localStorage.setItem(`whiteboard-save-${roomId}`, dataUrl);
    };

    const loadFromLocal = () => {
        if (!mainCanvasRef.current || !roomId) return;
        const savedData = localStorage.getItem(`whiteboard-save-${roomId}`);
        if (savedData) {
            const img = new Image();
            img.onload = () => {
                const ctx = mainCanvasRef.current.getContext('2d');
                ctx.drawImage(img, 0, 0);
            };
            img.src = savedData;
        }
    };

    // --- CANVAS INITIALIZATION ---
    useEffect(() => {
        const setupCanvas = (canvas) => {
            const ctx = canvas.getContext('2d');
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#0A0A0B'; // Dark color for white background
        };

        if (mainCanvasRef.current && previewCanvasRef.current) {
            setupCanvas(mainCanvasRef.current);
            setupCanvas(previewCanvasRef.current);
            loadFromLocal(); // Load saved drawing on mount
        }

        // Helper to get relative mouse position on canvas
        const getCanvasPos = (e) => {
            if (!mainCanvasRef.current) return { x: 0, y: 0 };
            const canvas = mainCanvasRef.current;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };
        };

        if (mainCanvasRef.current) mainCanvasRef.current.getCanvasPos = getCanvasPos;
        if (previewCanvasRef.current) previewCanvasRef.current.getCanvasPos = getCanvasPos;

        const onDrawRemote = (data) => {
            const ctx = mainCanvasRef.current?.getContext('2d');
            if (ctx) {
                // Drawing logic
                if (data.type === 'pencil') {
                    ctx.beginPath();
                    ctx.moveTo(data.x1, data.y1);
                    ctx.lineTo(data.x2, data.y2);
                    ctx.stroke();
                } else if (data.type === 'rect') {
                    ctx.strokeRect(data.x, data.y, data.w, data.h);
                } else if (data.type === 'arrow') {
                    const drawArrow = (ctx, startX, startY, endX, endY) => {
                        const headlen = 15;
                        const dx = endX - startX;
                        const dy = endY - startY;
                        const angle = Math.atan2(dy, dx);
                        ctx.beginPath();
                        ctx.moveTo(startX, startY);
                        ctx.lineTo(endX, endY);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(endX, endY);
                        ctx.lineTo(endX - headlen * Math.cos(angle - Math.PI / 6), endY - headlen * Math.sin(angle - Math.PI / 6));
                        ctx.lineTo(endX - headlen * Math.cos(angle + Math.PI / 6), endY - headlen * Math.sin(angle + Math.PI / 6));
                        ctx.closePath();
                        ctx.fill();
                    };
                    const oldFill = ctx.fillStyle;
                    ctx.fillStyle = ctx.strokeStyle;
                    drawArrow(ctx, data.x1, data.y1, data.x2, data.y2);
                    ctx.fillStyle = oldFill;
                }
                saveToLocal();
            }
        };

        const onClearRemote = () => {
            const ctx = mainCanvasRef.current?.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, mainCanvasRef.current.width, mainCanvasRef.current.height);
                localStorage.removeItem(`whiteboard-save-${roomId}`);
            }
        };

        // --- SOCKET LISTENERS ---
        socket.on('draw', onDrawRemote);
        socket.on('clear', onClearRemote);

        return () => {
            socket.off('draw', onDrawRemote);
            socket.off('clear', onClearRemote);
        };
    }, [socket, roomId]);

    // Draw Arrow Helper for local use
    const drawArrow = (ctx, startX, startY, endX, endY) => {
        const headlen = 15;
        const dx = endX - startX;
        const dy = endY - startY;
        const angle = Math.atan2(dy, dx);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - headlen * Math.cos(angle - Math.PI / 6), endY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(endX - headlen * Math.cos(angle + Math.PI / 6), endY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
    };

    const drawShape = (ctx, data) => {
        if (data.type === 'pencil') {
            ctx.beginPath();
            ctx.moveTo(data.x1, data.y1);
            ctx.lineTo(data.x2, data.y2);
            ctx.stroke();
        } else if (data.type === 'rect') {
            ctx.strokeRect(data.x, data.y, data.w, data.h);
        } else if (data.type === 'arrow') {
            const oldFill = ctx.fillStyle;
            ctx.fillStyle = ctx.strokeStyle;
            drawArrow(ctx, data.x1, data.y1, data.x2, data.y2);
            ctx.fillStyle = oldFill;
        }
    };

    // --- MOUSE HANDLERS ---
    const handleMouseDown = (e) => {
        if (role !== 'drawer') return;
        isDrawing.current = true;
        const pos = previewCanvasRef.current.getCanvasPos(e);
        startPos.current = pos;
        mainCanvasRef.current.lastX = pos.x;
        mainCanvasRef.current.lastY = pos.y;
    };

    const handleMouseMove = (e) => {
        if (!isDrawing.current || role !== 'drawer') return;
        const pos = previewCanvasRef.current.getCanvasPos(e);
        const lastX = mainCanvasRef.current.lastX;
        const lastY = mainCanvasRef.current.lastY;

        if (drawingTool === 'pencil') {
            const ctx = mainCanvasRef.current.getContext('2d');
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();

            socket.emit('draw', { type: 'pencil', x1: lastX, y1: lastY, x2: pos.x, y2: pos.y });

            mainCanvasRef.current.lastX = pos.x;
            mainCanvasRef.current.lastY = pos.y;
        } else {
            // Preview shape on the top canvas
            const ctx = previewCanvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height);

            if (drawingTool === 'rect') {
                ctx.strokeRect(startPos.current.x, startPos.current.y, pos.x - startPos.current.x, pos.y - startPos.current.y);
            } else if (drawingTool === 'arrow') {
                const oldFill = ctx.fillStyle;
                ctx.fillStyle = ctx.strokeStyle;
                drawArrow(ctx, startPos.current.x, startPos.current.y, pos.x, pos.y);
                ctx.fillStyle = oldFill;
            }
        }
    };

    const handleMouseUp = (e) => {
        if (!isDrawing.current || role !== 'drawer') return;
        isDrawing.current = false;

        if (drawingTool === 'pencil') {
            saveToLocal(); // Save after pencil stroke
        } else {
            const pos = previewCanvasRef.current.getCanvasPos(e);

            let data;
            if (drawingTool === 'rect') {
                data = { type: 'rect', x: startPos.current.x, y: startPos.current.y, w: pos.x - startPos.current.x, h: pos.y - startPos.current.y };
            } else if (drawingTool === 'arrow') {
                data = { type: 'arrow', x1: startPos.current.x, y1: startPos.current.y, x2: pos.x, y2: pos.y };
            }

            if (data) {
                drawShape(mainCanvasRef.current.getContext('2d'), data);
                socket.emit('draw', data);
                saveToLocal(); // Save after shape drawing
            }

            // Clear preview layer
            const pCtx = previewCanvasRef.current.getContext('2d');
            pCtx.clearRect(0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height);
        }
    };

    return (
        <div className="flex-1 p-6 flex flex-col">
            <div className="flex-1 bg-bg-light rounded-3xl overflow-hidden relative shadow-2xl border-4 border-primary/20">
                {/* Permanent drawing layer */}
                <canvas
                    ref={mainCanvasRef}
                    width={1200}
                    height={800}
                    className="absolute inset-0 w-full h-full"
                />
                {/* Interactive preview layer */}
                <canvas
                    ref={previewCanvasRef}
                    width={1200}
                    height={800}
                    className={`absolute inset-0 w-full h-full z-10 ${role === 'drawer' ? 'cursor-crosshair' : 'cursor-default'}`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                />

                {/* Tool Selector (Drawer only) */}
                {role === 'drawer' && (
                    <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                        <button
                            onClick={() => setDrawingTool('pencil')}
                            className={`p-3 rounded-2xl shadow-xl transition-all ${drawingTool === 'pencil' ? 'bg-primary text-white' : 'bg-bg-light text-text-dark hover:bg-gray-200'}`}
                            title="Pencil"
                        >
                            <Pencil size={20} />
                        </button>
                        <button
                            onClick={() => setDrawingTool('rect')}
                            className={`p-3 rounded-2xl shadow-xl transition-all ${drawingTool === 'rect' ? 'bg-primary text-white' : 'bg-bg-light text-text-dark hover:bg-gray-200'}`}
                            title="Rectangle"
                        >
                            <Square size={20} />
                        </button>
                        <button
                            onClick={() => setDrawingTool('arrow')}
                            className={`p-3 rounded-2xl shadow-xl transition-all ${drawingTool === 'arrow' ? 'bg-primary text-white' : 'bg-bg-light text-text-dark hover:bg-gray-200'}`}
                            title="Arrow"
                        >
                            <ArrowRight size={20} />
                        </button>
                    </div>
                )}

                {/* Clear Button (Drawer only) */}
                {role === 'drawer' && (
                    <button
                        onClick={() => socket.emit('clear')}
                        className="absolute top-4 right-4 p-3 bg-danger text-white rounded-2xl shadow-xl hover:opacity-90 transition-all font-bold flex items-center gap-2 z-20"
                    >
                        <Trash2 size={20} /> Clear
                    </button>
                )}
            </div>
        </div>
    );
});

export default Whiteboard;
