import Terminal from "./src/Terminal.js";

let parent = document.getElementById("terminal");

let terminal = new Terminal(parent);

terminal.registerCommand("clear", function(argv) {
    this.clear();
});

// echo command is working fine, but need some improvement with file descriptor
// writing to stdout by default and using the operator ">" to write in some file or
// piping to another command
// terminal.registerCommand("echo", function(argv) {
//     this.write(argv.join(" ") + "\n");
// });

function update() {
    terminal.update();
    requestAnimationFrame(update);
}

update();
