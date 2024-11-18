import "./style.css";

const APP_NAME = "Pixel Paint Palette";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

// Step 1 - Initial non-interactive UI layout
const header = document.createElement("h1");
header.textContent = APP_NAME;
app.appendChild(header);

const canvas = document.createElement("canvas");
canvas.id = "canvasPad";
canvas.width = 1920;
canvas.height = 1080;
canvas.style.width = "768px";
canvas.style.height = "512px";
app.appendChild(canvas);

const buttonContainer = document.createElement("div");
buttonContainer.id = "buttonContainer";
app.appendChild(buttonContainer);

// Sticker definitions
const stickers = [
    { emoji: "🎸", id: "s1Button", rotate: true },
    { emoji: "😳", id: "s2Button", rotate: true },
    { emoji: "🏀", id: "s3Button", rotate: true },
];

// Reusable button creation function
function createAndAppendButton({
    text,
    id,
    container,
    clickHandler,
}: {
    text: string;
    id: string;
    container: HTMLElement;
    clickHandler: () => void;
}) {
    const button = document.createElement("button");
    button.textContent = text;
    button.id = id;
    button.addEventListener("click", clickHandler);
    container.appendChild(button);
    return button;
}

// Add predefined stickers as buttons
stickers.forEach((sticker) => {
    createAndAppendButton({
        text: sticker.emoji,
        id: sticker.id,
        container: buttonContainer,
        clickHandler: () => {
            currentSticker = sticker.emoji;
            currentRotation = sticker.rotate ? Math.floor(Math.random() * 360) : 0;
            toolPreview = null;
            updateCurrentTool(document.getElementById(sticker.id) as HTMLButtonElement);
            canvas.dispatchEvent(new Event("tool-moved"));
        },
    });
});

// Add functional buttons
const buttonsConfig = [
    {
        text: "Clear",
        id: "clearButton",
        handler: () => {
            points = [];
            redoStack = [];
            canvas.dispatchEvent(new Event("drawing-changed"));
        },
    },
    {
        text: "Undo",
        id: "undoButton",
        handler: () => {
            if (points.length > 0) redoStack.push(points.pop()!);
            canvas.dispatchEvent(new Event("drawing-changed"));
        },
    },
    {
        text: "Redo",
        id: "redoButton",
        handler: () => {
            if (redoStack.length > 0) points.push(redoStack.pop()!);
            canvas.dispatchEvent(new Event("drawing-changed"));
        },
    },
    {
        text: "Thin",
        id: "thinButton",
        handler: () => {
            currentThickness = 1;
            currentSticker = null;
            updateCurrentTool(document.getElementById("thinButton") as HTMLButtonElement);
        },
    },
    {
        text: "Thick",
        id: "thickButton",
        handler: () => {
            currentThickness = 5;
            currentSticker = null;
            updateCurrentTool(document.getElementById("thickButton") as HTMLButtonElement);
        },
    },
    {
        text: "Export",
        id: "exportButton",
        handler: () => {
            const exportCanvas = document.createElement("canvas");
            exportCanvas.width = 1920;
            exportCanvas.height = 1080;
            const exportContext = exportCanvas.getContext("2d")!;
            exportContext.scale(4, 4);
            points.forEach((item) => {
                if ("points" in item) {
                    displayLine(item, exportContext);
                } else {
                    displaySticker(item, exportContext);
                }
            });
            exportCanvas.toBlob((blob) => {
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob!);
                link.download = "sketchpad_export.png";
                link.click();
            });
        },
    },
    {
        text: "Custom Sticker",
        id: "customStickerButton",
        handler: () => {
            const customSticker = prompt("Enter your custom sticker:", "♻️");
            if (customSticker) {
                const customStickerObj = {
                    emoji: customSticker,
                    id: `sticker${stickers.length + 1}Button`,
                    rotate: false,
                };
                stickers.push(customStickerObj);
                createAndAppendButton({
                    text: customSticker,
                    id: customStickerObj.id,
                    container: buttonContainer,
                    clickHandler: () => {
                        currentSticker = customSticker;
                        currentRotation = 0;
                        toolPreview = null;
                        updateCurrentTool(document.getElementById(customStickerObj.id) as HTMLButtonElement);
                        canvas.dispatchEvent(new Event("tool-moved"));
                    },
                });
            }
        },
    },
];

buttonsConfig.forEach(({ text, id, handler }) => {
    createAndAppendButton({
        text,
        id,
        container: buttonContainer,
        clickHandler: handler,
    });
});

// Add color picker
const colorPicker = document.createElement("input");
colorPicker.type = "color";
colorPicker.id = "colorPicker";
colorPicker.value = "#000000";
buttonContainer.appendChild(colorPicker);

const pen = canvas.getContext("2d") as CanvasRenderingContext2D;

// Interfaces for elements
interface Point {
    x: number;
    y: number;
}

interface Line {
    points: Point[];
    thickness: number;
    color: string;
}

interface Preview {
    x: number;
    y: number;
    thickness?: number;
    color?: string;
    emoji?: string;
    rotation?: number;
}

interface Sticker {
    x: number;
    y: number;
    emoji: string;
    rotation: number;
}

// Functions for drawing and displaying elements
const createLine = (x: number, y: number, thickness: number, color: string): Line => ({
    points: [{ x, y }],
    thickness,
    color
});

const dragLine = (line: Line, x: number, y: number) => {
    line.points.push({ x, y });
};

const displayLine = (line: Line, pen: CanvasRenderingContext2D) => {
    if (line.points.length < 2) return;
    pen.beginPath();
    pen.moveTo(line.points[0].x, line.points[0].y);
    for (let i = 1; i < line.points.length; i++) {
        pen.lineTo(line.points[i].x, line.points[i].y);
    }
    pen.lineWidth = line.thickness;
    pen.strokeStyle = line.color;
    pen.stroke();
};

const createPreview = (x: number, y: number, thickness: number, color: string): Preview => ({
    x,
    y,
    thickness,
    color
});

const updatePreviewPosition = (preview: Preview, x: number, y: number) => {
    preview.x = x;
    preview.y = y;
};

const drawPreview = (preview: Preview, pen: CanvasRenderingContext2D) => {
    pen.beginPath();
    pen.arc(preview.x, preview.y, preview.thickness! / 2, 0, Math.PI * 2);
    pen.fillStyle = preview.color!;
    pen.fill();
};

const createSticker = (x: number, y: number, emoji: string, rotation: number): Sticker => ({
    x,
    y,
    emoji,
    rotation
});

const displaySticker = (sticker: Sticker, pen: CanvasRenderingContext2D) => {
    pen.save();
    pen.translate(sticker.x, sticker.y);
    pen.rotate(sticker.rotation * Math.PI / 180);
    pen.font = '24px serif';
    pen.fillText(sticker.emoji, 0, 0);
    pen.restore();
};

let drawing = false;
let points: (Line | Sticker)[] = [];
let currentLine: Line | null = null;
let redoStack: (Line | Sticker)[] = [];
let currentThickness = 1;
let toolPreview: Preview | null = null;
let currentSticker: string | null = null;
const currentColor = '#000000';
let currentRotation = 0;

// Utility functions
function getMousePosition(event: MouseEvent): { offsetX: number; offsetY: number } {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        offsetX: (event.clientX - rect.left) * scaleX,
        offsetY: (event.clientY - rect.top) * scaleY
    };
}

function updateCurrentTool(selectedButton: HTMLButtonElement) {
    const allButtons = app.querySelectorAll('button');
    allButtons.forEach(button => button.classList.remove('selectedTool'));
    selectedButton.classList.add('selectedTool');
}

function _randomizeRotation() {
    currentRotation = Math.floor(Math.random() * 360);
}

// Event handling functions
function moveTool(event: MouseEvent) {
    if (drawing) return;
    const { offsetX, offsetY } = getMousePosition(event);

    if (currentSticker) {
        if (!toolPreview) {
            toolPreview = { x: offsetX, y: offsetY, emoji: currentSticker, rotation: currentRotation };
        } else {
            updatePreviewPosition(toolPreview, offsetX, offsetY);
        }
    } else {
        if (!toolPreview) {
            toolPreview = createPreview(offsetX, offsetY, currentThickness, currentColor);
        } else {
            updatePreviewPosition(toolPreview, offsetX, offsetY);
        }
    }
    canvas.dispatchEvent(new Event('tool-moved'));
}

function startDrawing(event: MouseEvent): void {
    const { offsetX, offsetY } = getMousePosition(event);

    if (currentSticker) {
        const sticker = createSticker(offsetX, offsetY, currentSticker, currentRotation);
        points.push(sticker);
        toolPreview = null;
        canvas.dispatchEvent(new Event('drawing-changed'));
    } else {
        drawing = true;
        currentLine = createLine(offsetX, offsetY, currentThickness, currentColor);
        points.push(currentLine);
        toolPreview = null;
    }
}

function draw(event: MouseEvent): void {
    if (!drawing || !currentLine) return;
    const { offsetX, offsetY } = getMousePosition(event);
    dragLine(currentLine, offsetX, offsetY);
    canvas.dispatchEvent(new Event('drawing-changed'));
}

function stopDrawing(): void {
    if (drawing) {
        drawing = false;
        currentLine = null;
        canvas.dispatchEvent(new Event('drawing-changed'));
    }
}

// Canvas rendering updates
canvas.addEventListener('drawing-changed', () => {
    pen.clearRect(0, 0, canvas.width, canvas.height);
    points.forEach(item => {
        if ('points' in item) {
            displayLine(item, pen);
        } else {
            displaySticker(item, pen);
        }
    });

    if (toolPreview) {
        if (toolPreview.emoji) {
            displaySticker({ x: toolPreview.x, y: toolPreview.y, emoji: toolPreview.emoji, rotation: toolPreview.rotation! }, pen);
        } else {
            drawPreview(toolPreview, pen);
        }
    }
});

canvas.addEventListener('tool-moved', () => {
    pen.clearRect(0, 0, canvas.width, canvas.height);
    points.forEach(item => {
        if ('points' in item) {
            displayLine(item, pen);
        } else {
            displaySticker(item, pen);
        }
    });

    if (toolPreview) {
        if (toolPreview.emoji) {
            displaySticker({ x: toolPreview.x, y: toolPreview.y, emoji: toolPreview.emoji, rotation: toolPreview.rotation! }, pen);
        } else {
            drawPreview(toolPreview, pen);
        }
    }
});

// Mouse event listeners for canvas interaction
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseleave", stopDrawing);
canvas.addEventListener('mousemove', moveTool);