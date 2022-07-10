
const TYPES = {
    "HEX": 16,
    "OCTAL": 8,
    "BINARY": 2
}

export default class Color {

    r; g; b;
    color;

    constructor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.color = r << 16 | g << 8 | b;
    }

    toString(type = "RGB") {
        if(type == "RGB") {
            return `rgb(${this.r}, ${this.g}, ${this.b})`;
        }
        return this.color.toString(TYPES[type]);
    }
    
}
