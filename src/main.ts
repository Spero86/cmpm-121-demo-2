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
    constructor(x: number, y: number, thickness: number) {
        this.x = x;
        this.y = y;
        this.thickness = thickness;
    }
    updatePosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    draw(context: CanvasRenderingContext2D) {
        context.beginPath();
        context.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
        context.fillStyle = 'rgba(0, 0, 0, 180)';
        context.fill();
    }
}

let drawing = false;
let points: penLine[] = [];
let currentLine: penLine | null = null;
let redoStack: penLine[] = [];
let currentThickness = 1;
let toolPreview: ToolPreview | null = null;

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
    if (!toolPreview) {
        toolPreview = new ToolPreview(offsetX, offsetY, currentThickness);
    } else {
        toolPreview.updatePosition(offsetX, offsetY);
    }
    canvas.dispatchEvent(new Event('tool-moved'));
}


function startDrawing(event: MouseEvent): void {
    drawing = true;

    const { offsetX, offsetY } = getMousePosition(event);
    currentLine = new penLine(offsetX, offsetY, currentThickness);
    points.push(currentLine);

    toolPreview = null;

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
    points.forEach(line => line.display(pen));

    if (toolPreview) {
        toolPreview.draw(pen);
    }
});
canvas.addEventListener('tool-moved', () => {
    pen.clearRect(0, 0, canvas.width, canvas.height);
    points.forEach(line => line.display(pen));
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
        const lastLine = points.pop();
        if (lastLine) {
            redoStack.push(lastLine);
        }
        canvas.dispatchEvent(new Event('drawing-changed'));
    }
});

redoButton.addEventListener('click', () => {
    if (redoStack.length > 0) {
        const lastLine = redoStack.pop();
        if (lastLine) {
            points.push(lastLine);
        }
        canvas.dispatchEvent(new Event('drawing-changed'));
    }
});

thinButton.addEventListener('click', () => {
    currentThickness = 1;
    thinButton.classList.add('currentTool');
    thickButton.classList.remove('currentTool');
});

thickButton.addEventListener('click', () => {
    currentThickness = 5;
    thickButton.classList.add('currentTool');
    thinButton.classList.remove('currentTool');
});
