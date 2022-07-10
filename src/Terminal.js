import Color from "./Color.js";

Math.sqrt = n => n ** 0.5;

export default class Terminal {

    context;

    foreground_color = new Color(255, 255, 255);
    background_color = new Color(0, 0, 0);

    // editor
    line_height = 25;
    char_width;

    // temporary
    buffer;
    header = "root:path$ ";
    cursor_position = {
        x: 0,
        y: 0
    }
    history = [];

    constructor(parentDoc) {

        let aspectRatio = 16 / 9;
        this.context = document.createElement("canvas");
        this.context.width = 800;
        this.context.height = this.context.width / aspectRatio;
        this.context.style.background = "black";
        this.context = this.context.getContext("2d");

        parentDoc.appendChild(this.context.canvas);

        document.addEventListener("keydown", e => {
            if (e.key == "Backspace") {
                if (this.cursor_position.x > this.header.length) {
                    this.buffer[this.cursor_position.y] = this.buffer[this.cursor_position.y].slice(0, this.cursor_position.x - 1) + this.buffer[this.cursor_position.y].slice(this.cursor_position.x);
                    this.cursor_position.x--;
                }
                return;
            }
            if (e.key == "Enter") {
                this.history.push(this.buffer[this.cursor_position.y]);
                this.buffer.push([this.header]);
                this.cursor_position.x = this.header.length;
                this.cursor_position.y++;
                return;
            }
            if (e.key == "ArrowUp") {
                return;
            }
            if (e.key == "ArrowDown") {
                return;
            }
            if (e.key == "ArrowLeft") {
                if (this.cursor_position.x > this.header.length) {
                    this.cursor_position.x--;
                }
                return;
            }
            if (e.key == "ArrowRight") {
                if (this.cursor_position.x < this.buffer[this.cursor_position.y].length) {
                    this.cursor_position.x++;
                }
                return;
            }
            if (e.key == "Shift") {
                return;
            }
            if (e.key == "Control") {
                return;
            }

            let { x, y } = this.cursor_position;
            this.buffer[y] = this.buffer[y].slice(0, x) + e.key + this.buffer[y].slice(x);
            this.cursor_position.x++;
        });

        this.context.canvas.addEventListener("keyup", e => {

        });

        this.context.font = "18px monospace";
        this.char_width = this.context.measureText("x").width;

        this.buffer = [this.header];
        this.cursor_position.x += this.header.length;

    }

    update() {

        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);

        this.context.fillStyle = `${this.foreground_color}`;

        for (let i = 0; i < this.buffer.length; i++) {
            let line = this.buffer[i];
            this.context.fillText(line, 5, 20 + i * this.line_height);
        }

        this.context.fillText("_", 5 + this.cursor_position.x * this.char_width, this.cursor_position.y * this.line_height + 20);

    }
}
