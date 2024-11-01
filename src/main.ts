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

let drawing = false;
const pen = canvas.getContext("2d") as CanvasRenderingContext2D;
let points: { x: number, y: number }[][] = [];
let currentLine: { x: number, y: number }[] = [];
let redoStack: { x: number, y: number }[][] = [];

function getMousePosition(event: MouseEvent): { offsetX: number; offsetY: number } {
    const rect = canvas.getBoundingClientRect();
    return {
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top
    };
}

function startDrawing(event: MouseEvent): void {
    drawing = true;

    currentLine = [];
    addPoint(event);

}

function draw(event: MouseEvent): void {
    if (!drawing) return;

    addPoint(event);
}

function stopDrawing(): void {

    if (drawing) {
        points.push(currentLine);
        currentLine = []; 
        drawing = false;
        canvas.dispatchEvent(new Event('drawing-changed'));
    }
}

function addPoint(event: MouseEvent) {
    const { offsetX, offsetY } = getMousePosition(event);
    currentLine.push({ x: offsetX, y: offsetY });
    canvas.dispatchEvent(new Event('drawing-changed'));
}

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseleave", stopDrawing);

canvas.addEventListener('drawing-changed', () => {
    pen.clearRect(0, 0, canvas.width, canvas.height);
    points.forEach(line => {
        pen.beginPath();
        line.forEach((point, index) => {
            if (index === 0) {
                pen.moveTo(point.x, point.y);
            } else {
                pen.lineTo(point.x, point.y);
            }
        });
        pen.stroke();
    });
  
    if (currentLine.length > 0) {
        pen.beginPath();
        currentLine.forEach((point, index) => {
            if (index === 0) {
                pen.moveTo(point.x, point.y);
            } else {
                pen.lineTo(point.x, point.y);
            }
        });
        pen.stroke();
    }
});

clearButton.addEventListener("click", () => {
    points = [];
    currentLine = []; 
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
