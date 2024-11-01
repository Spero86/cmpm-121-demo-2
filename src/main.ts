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
const customStickerButton = createButton("Custom Sticker", "customStickerButton");
customStickerButton.id = "customStickerButton";
app.appendChild(customStickerButton);

const stickers = [
    { emoji: '🎸', id: 's1Button', rotate: true },
    { emoji: '😳', id: 's2Button', rotate: true },
    { emoji: '🏀', id: 's3Button', rotate: true }
];

stickers.forEach(sticker => {
    const button = document.createElement('button');
    button.innerText = sticker.emoji;
    button.id = sticker.id;
    app.appendChild(button);
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

// Step 10 - High-resolution export
const exportButton = createButton("Export", "exportButton");
exportButton.id = "exportButton";
app.appendChild(exportButton);

// Step 12 - Give users more control
const colorPicker = document.createElement('input');
colorPicker.type = 'color';
colorPicker.id = 'colorPicker';
colorPicker.value = '#000000';
app.appendChild(colorPicker);

const pen = canvas.getContext("2d") as CanvasRenderingContext2D;

// Step 5 - Display commands
class penLine {

    private points: { x: number, y: number }[] = [];
    private thickness: number;
    private color: string;

    constructor(x: number, y: number, thickness: number, color: string) {
        this.points.push({ x, y });
        this.thickness = thickness;
        this.color = color;
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
        pen.strokeStyle = this.color;
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
    private rotation: number;

    constructor(x: number, y: number, emoji: string, rotation: number) {
        this.x = x;
        this.y = y;
        this.emoji = emoji;
        this.rotation = rotation;
    }
    display(pen: CanvasRenderingContext2D) {
        pen.save();
        pen.translate(this.x, this.y);
        pen.rotate(this.rotation * Math.PI / 180);
        pen.font = '24px serif';
        pen.fillText(this.emoji, this.x, this.y);
        pen.fillText(this.emoji, 0, 0);
        pen.restore();
    }
}

class StickerPreview {
    private x: number;
    private y: number;
    private emoji: string;
    private rotation: number;

    constructor(x: number, y: number, emoji: string, rotation: number) {
        this.x = x;
        this.y = y;
        this.emoji = emoji;
        this.rotation = rotation;
    }
    updatePosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    draw(pen: CanvasRenderingContext2D) {
        pen.save();
        pen.translate(this.x, this.y);
        pen.rotate(this.rotation * Math.PI / 180);
        pen.font = '24px serif';
        pen.fillText(this.emoji, 0, 0);
        pen.restore();
    }
}

let drawing = false;
let points: (penLine | Sticker)[] = [];
let currentLine: penLine | null = null;
let redoStack: (penLine | Sticker)[] = [];
let currentThickness = 1; 
let toolPreview: ToolPreview | StickerPreview | null = null;
let currentSticker: string | null = null;
let currentColor = '#000000'; 
let currentRotation = 0; 

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

function moveTool(event: MouseEvent) {
    if (drawing) return;
    const { offsetX, offsetY } = getMousePosition(event);

    if (currentSticker) {
        if (!toolPreview || !(toolPreview instanceof StickerPreview)) {
            toolPreview = new StickerPreview(offsetX, offsetY, currentSticker, currentRotation);
        } else {
            toolPreview.updatePosition(offsetX, offsetY);
        }
    } else {
        if (!toolPreview || !(toolPreview instanceof ToolPreview)) {
            toolPreview = new ToolPreview(offsetX, offsetY, currentThickness, currentColor);
        } else {
            toolPreview.updatePosition(offsetX, offsetY);
        }
    }
    canvas.dispatchEvent(new Event('tool-moved'));
}


function startDrawing(event: MouseEvent): void {

    const { offsetX, offsetY } = getMousePosition(event);

    if (currentSticker) {
        const sticker = new Sticker(offsetX, offsetY, currentSticker, currentRotation);
        points.push(sticker);
        toolPreview = null;
        canvas.dispatchEvent(new Event('drawing-changed'));
    } else {
        drawing = true;
        currentLine = new penLine(offsetX, offsetY, currentThickness, currentColor);
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

    points.forEach(item => item.display(exportContext));
    
    exportCanvas.toBlob(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob!);
        link.download = 'sketchpad_export.png';
        link.click();
    });
});