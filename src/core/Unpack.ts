import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import { unzip } from 'unzipit';
import { pipeline } from 'stream/promises';
import { DecompressStream } from 'zstd-napi';

// TODO: save errors to log
export default class Unpack {
  private static initialized = false;
  private static checked = false;

  constructor() {
    if (!Unpack.checked) {
      try {
        child_process.execSync(`which unzstd`, { stdio: 'pipe' });
        Unpack.initialized = true;
      } catch (e) {
        // unzstd not found, but don't throw yet - throw when unpack is called
      }
      Unpack.checked = true;
    }
  }

  /**
   * Unzip apkg file
   * @param p path to .apkg file
   * @param o folder for unpacking
   */
  async unpack(p: string, o: string): Promise<void> {
    if (!fs.existsSync(p)) throw new Error('Deck file not found in: ' + path);

    this.createDir(o);

    const buf = fs.readFileSync(p);
    const { entries } = await unzip(new Uint8Array(buf));

    for (const entry of Object.values(entries)) {
      if (entry.isDirectory) {
        continue;
      }
      const data = await entry.arrayBuffer();

      const output = path.join(o, entry.name);
      console.log('Unpacking file:', entry.name);

      if (/\.\./.test(output)) {
        console.warn('[zip warn]: ignoring maliciously crafted paths in zip file:', entry.name);
        throw new Error('File name contains special ');
      }

      // save unzipped files
      fs.mkdirSync(path.dirname(output), { recursive: true });

      // try to decompress
      fs.writeFileSync(output, new Uint8Array(data));

      try {
        child_process.execSync(`unzstd "${output}" -o "${output}_unzst" --rm`);

        fs.renameSync(`${output}_unzst`, `${output}`);
      } catch (e: any) {
        console.log('File not decompressed', output);
      }
    }
  }

  async unpackFile(path: string, output: string): Promise<void> {
    try {
      await pipeline(
        fs.createReadStream(path),
        new DecompressStream(),
        fs.createWriteStream(output),
      );
    } catch (e: any) {
      if (e?.message?.includes('Unknown frame descriptor')) {
        return;
      }
      throw new Error('Error during zstd decompress: ' + e);
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
