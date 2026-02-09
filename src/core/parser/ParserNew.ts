import Parser from "./Parser.js";
import protobuf from 'protobufjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ParserNew extends Parser {
    parseMedia(file: string) {
        if (!fs.existsSync(file)) throw new Error('Media file not found by path: ' + file);

        const buf = fs.readFileSync(file);

        let entries = [];
        try {
            const root = protobuf.loadSync(path.join(__dirname, '/../../protos/import_export.proto'));
            const MediaEntries = root.lookupType('anki.import_export.MediaEntries');
            // @ts-ignore
            const message = MediaEntries.decode(buf);
            entries = message.toJSON().entries || [];
        } catch (e: any) {
            throw new Error('Error during decode Proxy message: ' + e?.message);
        }

        const res: Record<string, string> = {};
        for (const i in entries) {
            res[String(i)] = String(entries?.[i]?.name);
        }
        return res;
    }

}

export default ParserNew;