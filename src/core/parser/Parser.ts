import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'node:stream/promises';
import {DecompressStream} from 'zstd-napi';
import util from 'node:util';
import yauzl from 'yauzl';

class Parser {
    parseMedia(file: string): Record<string, string> { return {} }

    /**
     * Unzip apkg file
     * @param file - .apkg deck path
     * @param out - unpacking path (folder)
     */
    async unpack(file: string, out: string): Promise<void> {
        if (!fs.existsSync(file)) throw new Error('File not found: ' + file);

        this.createDir(out);

        await new Promise((resolve, reject) => {
            yauzl.open(file, {lazyEntries: true}, function(err, zipfile) {
                if (err) throw err;
                zipfile.readEntry();

                zipfile.on("end", () => {
                    resolve(true);
                });
                zipfile.on("error", (e) => {
                    reject(e)
                })
                zipfile.on("entry", function(entry) {
                if (/\/$/.test(entry.fileName)) return zipfile.readEntry();
                
                zipfile.openReadStream(entry, function(err, readStream) {
                    if (err) throw err;
                    const writeStream = fs.createWriteStream(path.join(out, entry.fileName));
                        writeStream.on('finish', () => {
                        zipfile.readEntry();
                    });
                    writeStream.on('error', (e) => {
                        zipfile.readEntry();    
                    });
        
                    readStream
                    .pipe(writeStream)
                    .on('error', (err) => {
                        console.log('ERROR');
                        reject(err);
                    });
                });
                });
            });
        });
    }

    /**
     * Creates new dir if it doesn't exists
     * @param path folder path
     */
    private createDir(path: string) {
        try {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
        }
        } catch (e) {
        throw new Error('Fail to create temporary deck folder: ' + e);
        }
    }

    async unzstd(path: string, output: string): Promise<void> {
        util.debuglog(`Unpack file: ${path}`);
        const d = new DecompressStream();
        await pipeline(
            fs.createReadStream(path),
            d,
            fs.createWriteStream(output),
        );
    }
};

export default Parser