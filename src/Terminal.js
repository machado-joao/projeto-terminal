import Color from "./Color.js";

Math.sqrt = n => n ** 0.5;

let url_reg = /(https{0,1}):\/\/(([a-zA-Z0-1_%]{1,})\.(\w{1,3}))/

export default class Terminal {

    context;

    foreground_color = new Color(255, 255, 255);
    background_color = new Color(0, 0, 0);

    width = 73;

    // editor
    line_height = 25;
    char_width;

    // temporary
    buffer = [""];
    header = "[webterminal ~]$ ";
    cursor_position = {
        x: 0,
        y: 0,
        limit: 0
    };
    history = {
        commands: [],
        position: 0
    };
    mouse = {
        position: 0,
        isDown: false,
        href: ""
    };
    selection = {
        start: -1,
        end: -1
    };
    ctrl = false;
    commands = {};

    constructor(parentDoc) {

        let aspectRatio = 16 / 9;
        this.context = document.createElement("canvas");
        this.context.width = 800;
        this.context.height = this.context.width / aspectRatio;
        this.context.style.background = "black";
        this.context = this.context.getContext("2d");

        this.context.canvas.style.cursor = "text";

        parentDoc.appendChild(this.context.canvas);

        document.addEventListener("keydown", async e => {
            if(this.ctrl) {
                if(e.key == "c") {
                    navigator.clipboard.writeText(this.getSelectedText());
                }
                if(e.key == "v") {
                    this.write(await navigator.clipboard.readText());
                }
                return;
            }
            if (e.key == "Backspace") {
                if (this.cursor_position.x > this.cursor_position.limit) {
                    this.buffer[this.cursor_position.y] = this.buffer[this.cursor_position.y].slice(0, this.cursor_position.x - 1) + this.buffer[this.cursor_position.y].slice(this.cursor_position.x);
                    this.cursor_position.x--;
                }
                return;
            }
            if (e.key == "Enter") {
                let code = this.getCursorLineCode();
                let argv = code.split(" ");
                let command = argv.shift();
                this.write("\n");

                if(this.commands[command]) {
                    this.commands[command].call(this, argv);
                }else if(command) {
                    this.write(`bash: ${command}: command not found\n`);
                }

                this.history.commands.push(code);
                this.history.position++;
                this.write(this.header);
                this.cursor_position.limit = this.cursor_position.x;
                return;
            }
            if (e.key == "ArrowUp") {
                if(this.history.position > 0) {
                    this.buffer[this.cursor_position.y] = this.header + this.history.commands[--this.history.position];
                    this.cursor_position.x = this.getCursorLine().length;
                }
                return;
            }
            if (e.key == "ArrowDown") {
                if(this.history.position < this.history.commands.length) {
                    this.buffer[this.cursor_position.y] = this.header + (this.history.commands[++this.history.position] || "");
                    this.cursor_position.x = this.getCursorLine().length;
                }
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
                this.ctrl = true;
                return;
            }
            if(e.key == "AltGraph") return;

            let { x, y } = this.cursor_position;
            this.buffer[y] = this.buffer[y].slice(0, x) + e.key + this.buffer[y].slice(x);
            this.cursor_position.x++;
        });

        document.addEventListener("keyup", e => {
            if(e.key == "Control") {
                this.ctrl = false;
            }
        });

        this.context.canvas.addEventListener("mousemove", e => {
            this.mouse.position = Math.floor((e.clientX - 5) / this.char_width) + Math.floor((e.clientY - 5) / this.line_height) * this.width;
            if(this.mouse.isDown) {
                this.selection.end = this.mouse.position;
            }
        });

        this.context.canvas.addEventListener("mousedown", e => {
            if(this.mouse.href) {
                window.open(this.mouse.href, "blank");
                return;
            }
            this.selection.start = this.mouse.position;
            this.selection.end = -1;
            this.mouse.isDown = true;
        });

        this.context.canvas.addEventListener("mouseup", e => {
            this.mouse.isDown = false;
        });

        this.context.font = "18px monospace";
        this.char_width = this.context.measureText("x").width;

        this.write(this.header);
        this.cursor_position.limit = this.header.length;

    }

    update() {
        this.context.canvas.style.cursor = "text";

        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
        
        this.context.fillStyle = `${this.foreground_color}`;

        let sx, sy, ex, ey;
        if(this.selection.end !== -1 && this.selection.start != -1) {
            let end = this.selection.end;
            let start = this.selection.start;
            if(start > end) {
                end = start;
                start = this.selection.end;
            }
            sx = start % this.width;
            sy = Math.floor(start / this.width);
            ex = end % this.width;
            ey = Math.floor(end / this.width);
            for(let y = sy; y <= ey; y++) {
                let x = y == sy ? sx : 0;
                let w = sy == ey ? ex - sx : (y == sy ? this.width - sx : (y == ey ? ex : this.width));
                this.context.fillRect(5 + this.char_width * x, 2 + y * this.line_height, this.char_width * w, this.line_height);
            }
        }

        for (let i = 0; i < this.buffer.length; i++) {
            let line = this.buffer[i];
            let pattern = url_reg.exec(line);
            this.context.fillStyle = `${this.foreground_color}`;

            let mx = this.mouse.position % this.width;
            let my = Math.floor(this.mouse.position / this.width);
            if(pattern && my == i && mx >= pattern.index && mx < pattern.index + pattern[0].length) {
                this.context.canvas.style.cursor = "pointer";
                this.mouse.href = pattern[0];
                this.context.fillRect(5 + pattern.index * this.char_width, 25 + i * this.line_height, pattern[0].length * this.char_width, 1);
            }else this.mouse.href = "";

            if(sx != undefined && sy != undefined && ex != undefined && ey != undefined) {
                let x = i == sy ? sx : 0;
                let w = sy == ey ? ex - sx : (i == sy ? line.length - sx : (i == ey ? ex : line.length));
                if(i >= sy && i <= ey && x < line.length) {
                    this.context.fillStyle = `${this.foreground_color}`;
                    this.context.fillText(line.substring(0, x), 5, 20 + i * this.line_height);
                    this.context.fillText(line.substring(x + w, line.length), 5 + this.char_width * (x + w), 20 + i * this.line_height);
                    this.context.fillStyle = `${this.background_color}`;
                    this.context.fillText(line.substring(x, x + w), 5 + this.char_width * x, 20 + i * this.line_height);
                    continue;
                }
            }
            this.context.fillText(line, 5, 20 + i * this.line_height);
        }
        
        this.context.fillStyle = `${this.foreground_color}`;
        this.context.fillText("_", 5 + this.cursor_position.x * this.char_width, this.cursor_position.y * this.line_height + 20);

    }

    getLine(y) {
        return this.buffer[y];
    }

    getCursorLineCode() {
        return this.getCursorLine().substring(this.header.length);
    }

    getCursorLine() {
        return this.buffer[this.cursor_position.y];
    }

    registerCommand(command, callback) {
        if(this.commands[command]) {
            return console.warn(`Command ${command} already exists.`);
        }
        this.commands[command] = callback;
    }
    
    write(text) {
        if(text.includes("\n")) {
            let lines = text.split("\n");
            let first_line = lines.shift();
            this.buffer[this.cursor_position.y] += first_line;
            this.buffer.push(...lines);
        }else {
            this.buffer[this.cursor_position.y] += text;
        }
        this.cursor_position.y = this.buffer.length - 1;
        this.cursor_position.x = this.getCursorLine().length;
    }

    getSelectedText() {
        let text = "";
        let sx, sy, ex, ey;
        if(this.selection.end !== -1 && this.selection.start != -1) {
            let end = this.selection.end;
            let start = this.selection.start;
            if(start > end) {
                end = start;
                start = this.selection.end;
            }
            sx = start % this.width;
            sy = Math.floor(start / this.width);
            ex = end % this.width;
            ey = Math.floor(end / this.width);
            for(let y = sy; y <= ey; y++) {
                let line = this.getLine(y);
                let x = y == sy ? sx : 0;
                let w = sy == ey ? ex - sx : (y == sy ? line.length - sx : (y == ey ? ex : line.length));
                text += `${line.substring(x, x + w)}\n`;
            }
        }
        return text.substring(0, text.length - 1);
    }

    clear() {
        this.buffer = [""];
        this.cursor_position.y = 0;
        this.cursor_position.x = 0;
        this.cursor_position.limit = 0;
    }

}
