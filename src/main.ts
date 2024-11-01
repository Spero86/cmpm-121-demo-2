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
const createButton = (text: string, id: string): HTMLButtonElement => {
    const button = document.createElement("button");
    button.textContent = text;
    button.id = id;
    return button;
};

const clearButton = createButton("Clear", "clearButton");
clearButton.id = "clearButton";
app.appendChild(clearButton);

let drawing = false;
const pen = canvas.getContext("2d") as CanvasRenderingContext2D;

// Helper function to get mouse position relative to the canvas
function getMousePosition(event: MouseEvent): { offsetX: number; offsetY: number } {
    const rect = canvas.getBoundingClientRect();
    return {
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top
    };
}

// Start drawing when mouse is pressed down
function startDrawing(event: MouseEvent): void {
    drawing = true;
    const { offsetX, offsetY } = getMousePosition(event);
    pen.beginPath();
    pen.moveTo(offsetX, offsetY);
}

// Draw on the canvas as the mouse moves
function draw(event: MouseEvent): void {
    if (!drawing) return;
    const { offsetX, offsetY } = getMousePosition(event);
    pen.lineTo(offsetX, offsetY);
    pen.stroke();
}

// Stop drawing when mouse is released
function stopDrawing(): void {
    drawing = false;
}

// Attach event listeners to the canvas
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseleave", stopDrawing);

clearButton.addEventListener("click", () => {
    pen.clearRect(0, 0, canvas.width, canvas.height);
});
