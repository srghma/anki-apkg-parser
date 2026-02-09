import fs from 'fs';
import Parser from "./Parser.js";

class ParserOld extends Parser {
    parseMedia(file: string) {
        if (!fs.existsSync(file)) throw new Error('Media file not found by path: ' + file);

        const buf = fs.readFileSync(file);
        return JSON.parse(buf.toString());
    }
}

export default ParserOld;