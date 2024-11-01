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
app.appendChild(clearButton);
const pen = canvas.getContext("2d")!;
let drawing = false;

const startDrawing = (): void => { drawing = true; };
const stopDrawing = (): void => {
    drawing = false;
    pen.beginPath();
};
const draw = (event: MouseEvent): void => {
    if (!drawing) return;
    pen.lineWidth = 2;
    pen.lineCap = "round";
    pen.strokeStyle = "black";
    pen.lineTo(event.offsetX, event.offsetY);
    pen.stroke();
    pen.beginPath();
    pen.moveTo(event.offsetX, event.offsetY);
};

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mousemove", draw);

clearButton.addEventListener("click", () => {
    pen.clearRect(0, 0, canvas.width, canvas.height);
});
