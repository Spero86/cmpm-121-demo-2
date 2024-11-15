import "./style.css";

const APP_NAME = "Pixel Paint Pallete";
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

// Step 2 - Simple marker drawing
// Step 3 - Display list and observer
const createButton = (text: string, id: string): HTMLButtonElement => {
    const button = document.createElement("button");
    button.textContent = text;
    button.id = id;
    return button;
};

// Step 8 - Multiple stickers
// Step 9 - Custom stickers

const buttonContainer = document.createElement("div");
buttonContainer.id = "buttonContainer";
app.appendChild(buttonContainer);

const clearButton = createButton("Clear", "clearButton");
buttonContainer.appendChild(clearButton);

const undoButton = createButton("Undo", "undoButton");
buttonContainer.appendChild(undoButton);

const redoButton = createButton("Redo", "redoButton");
buttonContainer.appendChild(redoButton);

const thinButton = createButton("Thin", "thinButton");
buttonContainer.appendChild(thinButton);

const thickButton = createButton("Thick", "thickButton");
buttonContainer.appendChild(thickButton);

const exportButton = createButton("Export", "exportButton");
buttonContainer.appendChild(exportButton);

const colorPicker = document.createElement('input');
colorPicker.type = 'color';
colorPicker.id = 'colorPicker';
colorPicker.value = '#000000';
buttonContainer.appendChild(colorPicker);

buttonContainer.appendChild(document.createElement("br"));

const customStickerButton = createButton("Custom Sticker", "customStickerButton");
buttonContainer.appendChild(customStickerButton);

const stickers = [
    { emoji: '🎸', id: 's1Button', rotate: true },
    { emoji: '😳', id: 's2Button', rotate: true },
    { emoji: '🏀', id: 's3Button', rotate: true }
];

stickers.forEach(sticker => {
    const button = document.createElement('button');
    button.innerText = sticker.emoji;
    button.id = sticker.id;
    buttonContainer.appendChild(button);
    button.addEventListener('click', () => {
        currentSticker = sticker.emoji;
        if (sticker.rotate) {
            randomizeRotation();
        } else {
            currentRotation = 0;
        }
        toolPreview = null;
        updateCurrentTool(button);
        canvas.dispatchEvent(new Event('tool-moved'));
    });
});

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
let currentColor = '#000000';
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

function randomizeRotation() {
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

// Color picker and button events
colorPicker.addEventListener('input', (event) => {
    currentColor = (event.target as HTMLInputElement).value;
});

clearButton.addEventListener("click", () => {
    points = [];
    redoStack = [];
    pen.clearRect(0, 0, canvas.width, canvas.height);
    canvas.dispatchEvent(new Event('drawing-changed'));
});

undoButton.addEventListener('click', () => {
    if (points.length > 0) {
        const lastItem = points.pop();
        if (lastItem) redoStack.push(lastItem);
        canvas.dispatchEvent(new Event('drawing-changed'));
    }
});

redoButton.addEventListener('click', () => {
    if (redoStack.length > 0) {
        const lastItem = redoStack.pop();
        if (lastItem) points.push(lastItem);
        canvas.dispatchEvent(new Event('drawing-changed'));
    }
});

thinButton.addEventListener('click', () => {
    currentThickness = 1;
    currentSticker = null;
    updateCurrentTool(thinButton);
    canvas.dispatchEvent(new Event('tool-moved'));
});

thickButton.addEventListener('click', () => {
    currentThickness = 5;
    currentSticker = null;
    updateCurrentTool(thickButton);
    canvas.dispatchEvent(new Event('tool-moved'));
});

customStickerButton.addEventListener('click', () => {
    const customSticker = prompt('Enter your custom sticker:', '♻️');
    if (customSticker) {
        const customStickerObj = { emoji: customSticker, id: `sticker${stickers.length + 1}Button`, rotate: false };
        stickers.push(customStickerObj);
        const button = document.createElement('button');
        button.innerText = customSticker;
        button.id = customStickerObj.id;
        app.appendChild(button);
        button.addEventListener('click', () => {
            currentSticker = customSticker;
            currentRotation = 0;
            toolPreview = null;
            updateCurrentTool(button);
            canvas.dispatchEvent(new Event('tool-moved'));
        });
    }
});

exportButton.addEventListener('click', () => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 1024;
    exportCanvas.height = 1024;
    const exportContext = exportCanvas.getContext('2d')!;
    exportContext.scale(4, 4);
    points.forEach(item => {
        if ('points' in item) {
            displayLine(item, exportContext);
        } else {
            displaySticker(item, exportContext);
        }
    });

    exportCanvas.toBlob(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob!);
        link.download = 'sketchpad_export.png';
        link.click();
    });
});

// Mouse event listeners for canvas interaction
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseleave", stopDrawing);
canvas.addEventListener('mousemove', moveTool);