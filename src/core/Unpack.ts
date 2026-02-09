import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'node:stream/promises';
import * as fzstd from 'fzstd';
import yauzl from 'yauzl';
import { Transform } from 'node:stream';
import { createReadStream, createWriteStream } from 'node:fs';

export default class Unpack {

  /**
   * Unzip apkg file
   * @param file - .apkg deck path
   * @param out - unpacking path (folder)
   */
  async unpack(file: string, out: string): Promise<void> {
    if (!fs.existsSync(file)) throw new Error('File not found: ' + file);

    this.createDir(out);

    // decompress deck
    await new Promise((resolve, reject) => {
      yauzl.open(file, {lazyEntries: true}, function(err, zipfile) {
        if (err) return reject(err);
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
                reject(err);
              });
          });
        });
      });
    });

    const zst = path.join(out, 'zst');
    if(!fs.existsSync(zst)) fs.mkdirSync(zst);
    
    // unzip zstd
    const files = fs.readdirSync(out);

    for (let file of files) {
      const target = path.join(out, file);
      if (fs.lstatSync(target).isDirectory()) continue;

      const targetUnzst = path.join(zst, file);
      const result = await this.unzstdFile(target, targetUnzst);

      if (result && fs.existsSync(result)) fs.renameSync(result, target); 
    }
  }

  async unzstdFile(inputPath: string, outputPath: string) {
    try {
      await pipeline(
        createReadStream(inputPath),
        new ZstdDecompressor(),
        createWriteStream(outputPath)
      );
      return outputPath;
    } catch (err: any) {
      // console.error('Decompression failed:', inputPath, err.message);
      if (fs.existsSync(outputPath)) fs.rmSync(outputPath, {recursive: true});
      return null;
    }
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
}


class ZstdDecompressor extends Transform {
  public decompressor: any = null;

  constructor() {
    super();
    this.decompressor = new fzstd.Decompress((chunk: any) => {
      this.push(chunk);
    });
  }

  _transform(chunk: any, encoding: any, callback: Function) {
    try {
      this.decompressor.push(chunk);
      callback();
    } catch (err) {
      callback(err);
    }
  }

  _flush(callback: Function) {
    try {
      this.decompressor.push(new Uint8Array(0), true);
      callback();
    } catch (err) {
      callback(err);
    }
  }
}