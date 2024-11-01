import "./style.css";

const APP_NAME = "Pixel Paint Pallete";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;

// Step 1 - Initial non-interactive UI layout
const header = document.createElement("h1");
header.textContent = APP_NAME;
app.appendChild(header);

const canvas = document.createElement("canvas");
canvas.id = "canvasPad";
app.appendChild(canvas);
