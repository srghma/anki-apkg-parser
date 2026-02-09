import protobuf from 'protobufjs';
import { DB_FILES } from '../constants.js';
import * as fs from 'fs';
import * as path from 'path';
import Anki21bDb from './db/Anki21bDb.js';
import Anki21Db from './db/Anki21Db.js';
import Anki2Db from './db/Anki2Db.js';
import Db from './db/Db.js';
import ParserNew from './parser/ParserNew.js';
import Parser from './parser/Parser.js';
import ParserOld from './parser/ParserOld.js';
import Unpack from './Unpack.js';

export default class Apkg {
  private db: Db;
  private dbOpened: boolean = false;
  private parser: Parser;
  private folder: string = '';


  constructor(folder: string) {
    this.folder = folder;

    const files = fs.readdirSync(this.folder);

    if (files.includes(DB_FILES.anki21b)) {
      this.db = new Anki21bDb(path.join(this.folder, DB_FILES.anki21b));
      this.parser = new ParserNew();
    } else if (files.includes(DB_FILES.anki21)) {
      this.db = new Anki21Db(path.join(this.folder, DB_FILES.anki21));
      this.parser = new ParserOld();
    } else {
      this.db = new Anki2Db(path.join(this.folder, DB_FILES.anki2));
      this.parser = new ParserOld();
    };
  }

  static async create(apkgFile: string, folder: string) {
    const unpacker = new Unpack();
    await unpacker.unpack(apkgFile, folder);

    return new Apkg(folder); 
  }

  /**
   * Open and return main database
   * @returns current database
   */
  public async getDb(): Promise<Db> {
    if (this.dbOpened) return this.db;

    await this.db.open();
    this.dbOpened = true;

    return this.db;
  }

  /**
   * Returns json with media files list
   * @param mediaFile - path to "media" file in case you want to manually set it
   * @returns Json media list
   */
  async getMedia(): Promise<Record<string, string>> {
    const file = path.join(this.folder, 'media');
    return await this.parser.parseMedia(file);
  }
}
