import Terminal from "./src/Terminal.js";

let parent = document.getElementById("terminal");

let terminal = new Terminal(parent);

function update() {
    terminal.update();
    requestAnimationFrame(update);
}

update();
