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
const s1Button = createButton("🎸", "s1Button");
s1Button.id = "s1Button";
app.appendChild(s1Button);

const s2Button = createButton("😳", "s2Button");
s2Button.id = "s2Button";
app.appendChild(s2Button);

const s3Button = createButton("🏀", "s3Button");
s3Button.id = "s3Button";
app.appendChild(s3Button);

const clearButton = createButton("Clear", "clearButton");
clearButton.id = "clearButton";
app.appendChild(clearButton);

// Step 4 - Undo/Redo system
const undoButton = createButton("Undo", "undoButton");
undoButton.id = "undoButton";
app.appendChild(undoButton);

const redoButton = createButton("Redo", "redoButton");
redoButton.id = "redoButton";
app.appendChild(redoButton);

// Step 6 - Multiple markers
const thinButton = createButton("Thin", "thinButton");
thinButton.id = "thinButton";
app.appendChild(thinButton);

const thickButton = createButton("Thick", "thickButton");
thickButton.id = "thickButton";
app.appendChild(thickButton);

// Step 10 - High resolution export
const exportButton = createButton("Export", "exportButton");
exportButton.id = "exportButton";
app.appendChild(exportButton);

const pen = canvas.getContext("2d") as CanvasRenderingContext2D;

// Step 5 - Display commands
class penLine {

    private points: { x: number, y: number }[] = [];
    private thickness: number;

    constructor(x: number, y: number, thickness: number) {
        this.points.push({ x, y });
        this.thickness = thickness;
    }
    drag(x: number, y: number) {
        this.points.push({ x, y });
    }
    display(pen: CanvasRenderingContext2D) {
        if (this.points.length < 2) return;
        pen.beginPath();
        pen.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            pen.lineTo(this.points[i].x, this.points[i].y);
        }
        pen.lineWidth = this.thickness;
        pen.stroke();
    }
}

// Step 7 - Tool preview
class ToolPreview {
    private x: number;
    private y: number;
    private thickness: number;
    private color: string;

    constructor(x: number, y: number, thickness: number, color: string) {
        this.x = x;
        this.y = y;
        this.thickness = thickness;
        this.color = color;
    }
    updatePosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    draw(pen: CanvasRenderingContext2D) {
        pen.beginPath();
        pen.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
        pen.fillStyle = this.color;
        pen.fill();
    }
}

class Sticker {
    private x: number;
    private y: number;
    private emoji: string;
    constructor(x: number, y: number, emoji: string) {
        this.x = x;
        this.y = y;
        this.emoji = emoji;
    }
    display(pen: CanvasRenderingContext2D) {
        pen.font = '24px serif';
        pen.fillText(this.emoji, this.x, this.y);
    }
}

class StickerPreview {
    private x: number;
    private y: number;
    private emoji: string;
    constructor(x: number, y: number, emoji: string) {
        this.x = x;
        this.y = y;
        this.emoji = emoji;
    }
    updatePosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    draw(pen: CanvasRenderingContext2D) {
        pen.font = '24px serif';
        pen.fillText(this.emoji, this.x, this.y);
    }
}

let drawing = false;
let points: (penLine | Sticker)[] = [];
let currentLine: penLine | null = null;
let redoStack: (penLine | Sticker)[] = [];
let currentThickness = 1; // Default thickness
let toolPreview: ToolPreview | StickerPreview | null = null;
let previewColor = 'black'; // Default color for thin preview
let currentSticker: string | null = null;

function getMousePosition(event: MouseEvent): { offsetX: number; offsetY: number } {
    const rect = canvas.getBoundingClientRect();
    return {
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top
    };
}

function moveTool(event: MouseEvent) {
    if (drawing) return;
    const { offsetX, offsetY } = getMousePosition(event);

    if (currentSticker) {
        if (!toolPreview || !(toolPreview instanceof StickerPreview)) {
            toolPreview = new StickerPreview(offsetX, offsetY, currentSticker);
        } else {
            toolPreview.updatePosition(offsetX, offsetY);
        }
    } else {
        if (!toolPreview || !(toolPreview instanceof ToolPreview)) {
            toolPreview = new ToolPreview(offsetX, offsetY, currentThickness, previewColor);
        } else {
            toolPreview.updatePosition(offsetX, offsetY);
        }
    }
    canvas.dispatchEvent(new Event('tool-moved'));
}


function startDrawing(event: MouseEvent): void {

    const { offsetX, offsetY } = getMousePosition(event);

    if (currentSticker) {
        const sticker = new Sticker(offsetX, offsetY, currentSticker);
        points.push(sticker);
        toolPreview = null;
        canvas.dispatchEvent(new Event('drawing-changed'));
    } else {
        drawing = true;
        currentLine = new penLine(offsetX, offsetY, currentThickness);
        points.push(currentLine);
        toolPreview = null;
    }
}

function draw(event: MouseEvent): void {
    if (!drawing) return;

    if (!drawing || !currentLine) return;
    const { offsetX, offsetY } = getMousePosition(event);
    currentLine.drag(offsetX, offsetY);
    canvas.dispatchEvent(new Event('drawing-changed'));
}

function stopDrawing(): void {

    if (drawing) {
        drawing = false;
        currentLine = null;
        canvas.dispatchEvent(new Event('drawing-changed'));
    }
}

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseleave", stopDrawing);
canvas.addEventListener('mousemove', moveTool);

canvas.addEventListener('drawing-changed', () => {
    pen.clearRect(0, 0, canvas.width, canvas.height);
    points.forEach(item => item.display(pen));

    if (toolPreview) {
        toolPreview.draw(pen);
    }
});
canvas.addEventListener('tool-moved', () => {
    pen.clearRect(0, 0, canvas.width, canvas.height);
    points.forEach(item => item.display(pen));

    if (toolPreview) {
        toolPreview.draw(pen);
    }
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
        if (lastItem) {
            redoStack.push(lastItem);
        }
        canvas.dispatchEvent(new Event('drawing-changed'));
    }
});

redoButton.addEventListener('click', () => {
    if (redoStack.length > 0) {
        const lastItem = redoStack.pop();
        if (lastItem) {
            points.push(lastItem);
        }
        canvas.dispatchEvent(new Event('drawing-changed'));
    }
});

thinButton.addEventListener('click', () => {
    currentThickness = 1;
    previewColor = 'black';
    currentSticker = null;
    thinButton.classList.add('currentTool');
    thickButton.classList.remove('currentTool');
    s1Button.classList.remove('currentTool');
    s2Button.classList.remove('currentTool');
    s3Button.classList.remove('currentTool');
});

thickButton.addEventListener('click', () => {
    currentThickness = 5;
    previewColor = 'gray';
    currentSticker = null; 
    thickButton.classList.add('currentTool');
    thinButton.classList.remove('currentTool');
    s1Button.classList.remove('currentTool');
    s2Button.classList.remove('currentTool');
    s3Button.classList.remove('currentTool');
});

s1Button.addEventListener('click', () => {
    currentSticker = '🎸';
    toolPreview = null; 
    s1Button.classList.add('currentTool');
    s2Button.classList.remove('currentTool');
    s3Button.classList.remove('currentTool');
    thinButton.classList.remove('currentTool');
    thickButton.classList.remove('currentTool');
    canvas.dispatchEvent(new Event('tool-moved'));
});

s2Button.addEventListener('click', () => {
    currentSticker = '😳';
    toolPreview = null;
    s2Button.classList.add('currentTool');
    s1Button.classList.remove('currentTool');
    s3Button.classList.remove('currentTool');
    thinButton.classList.remove('currentTool');
    thickButton.classList.remove('currentTool');
    canvas.dispatchEvent(new Event('tool-moved'));
});

s3Button.addEventListener('click', () => {
    currentSticker = '🏀';
    toolPreview = null;
    s3Button.classList.add('currentTool');
    s1Button.classList.remove('currentTool');
    s2Button.classList.remove('currentTool');
    thinButton.classList.remove('currentTool');
    thickButton.classList.remove('currentTool');
    canvas.dispatchEvent(new Event('tool-moved'));
});
