import { Apkg } from './index';
import fs from 'fs';
import path from 'path';

function renderAudioPath(audioField: string, mediaMap: Record<string, string>, unpackedFolder: string, publicMediaDir: string, missingAudio: string[]) {
  const filename = audioField.replace(/\[sound:(.*?)\]/, '$1');
  const numericId = Object.keys(mediaMap).find(k => mediaMap[k] === filename);
  
  if (numericId) {
    const sourcePath = path.join(unpackedFolder, numericId);
    const destPath = path.join(publicMediaDir, filename);

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      return `media/${filename}`;
    }
  }
  
  missingAudio.push(filename);
  return null;
}

async function main() {
  const deckPath = path.join(process.cwd(), 'input.apkg');
  const unpackedFolder = path.join(process.cwd(), 'unpacked');
  const outputJsonPath = path.join(process.cwd(), 'data.json');
  const publicMediaDir = path.join(process.cwd(), 'media');

  try {
    console.log("Unpacking and parsing...");
    const apkg = await Apkg.create(deckPath, unpackedFolder);

    const mediaMap = await apkg.getMedia();
    const db = await apkg.getDb();
    const notes = await db.getNotes();

    if (!fs.existsSync(publicMediaDir)) fs.mkdirSync(publicMediaDir);

    const fieldConfig: Record<string, { side: 'front' | 'back' }> = {
      "word": { side: 'front' },
      "wordrom": { side: 'front' },
      "worden": { side: 'back' },
      "sent": { side: 'front' },
      "sentrom": { side: 'front' },
      "senten": { side: 'back' },
      "pos": { side: 'back' },
      "ety": { side: 'front' },
      "pronunciation": { side: 'front' },
      "senses": { side: 'front' },
      "derivedTerms": { side: 'front' },
      "wiktionary1": { side: 'front' },
      "wiktionary2": { side: 'front' },
      "wiktionary3": { side: 'front' },
      "wiktionary4": { side: 'front' },
      "wiktionary5": { side: 'front' },
      "wiktionary6": { side: 'front' },
    };

    const allFieldsOrder = [
      "word", "wordrom", "worden", "sent", "sentrom", "senten", "pos", "ety", 
      "pronunciation", "senses", "derivedTerms", "wordaudio", "sentaudio", 
      "wiktionary1", "wiktionary2", "wiktionary3", "wiktionary4", "wiktionary5", "wiktionary6"
    ];

    const columnHasData: Record<string, boolean> = {};
    allFieldsOrder.forEach(f => columnHasData[f] = false);

    const missingAudio: string[] = [];
    const processedNotes: any[] = [];

    for (const note of notes) {
      const fieldsValues = note.flds.split('\u001f');
      const fieldMap: Record<string, string> = {};
      
      allFieldsOrder.forEach((name, idx) => {
        const val = fieldsValues[idx] || '';
        fieldMap[name] = val;
        if (val && name !== 'wordaudio' && name !== 'sentaudio') {
          columnHasData[name] = true;
        }
      });

      const rowData: Record<string, any> = {};
      for (const name of Object.keys(fieldConfig)) {
        let val = fieldMap[name] || '';
        
        if (name === 'word') {
          const audioField = fieldMap['wordaudio'];
          if (audioField) {
            const audioPath = renderAudioPath(audioField, mediaMap, unpackedFolder, publicMediaDir, missingAudio);
            rowData[`${name}_audio`] = audioPath;
          }
        } else if (name === 'sent') {
          const audioField = fieldMap['sentaudio'];
          if (audioField) {
            const audioPath = renderAudioPath(audioField, mediaMap, unpackedFolder, publicMediaDir, missingAudio);
            rowData[`${name}_audio`] = audioPath;
          }
        }
        
        rowData[name] = val;
      }
      processedNotes.push(rowData);
    }

    const finalHeaders = Object.keys(fieldConfig).filter(h => columnHasData[h]);
const outputData = processedNotes;

await Bun.write(outputJsonPath, JSON.stringify(outputData, null, 2));
console.log(`Success! Data exported to ${outputJsonPath}`);

if (missingAudio.length > 0) {
  console.error("\nMissing Audio Files:");
  const uniqueMissing = [...new Set(missingAudio)];
  uniqueMissing.forEach(f => console.error(`- ${f}`));
}


  } catch (e) {
    console.error('Error processing apkg:', e);
  }
}

main();
