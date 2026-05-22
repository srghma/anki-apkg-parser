import { Apkg } from './index';
import fs from 'fs';
import path from 'path';

function renderAudioBtn(audioField: string, mediaMap: Record<string, string>, unpackedFolder: string, publicMediaDir: string, missingAudio: string[]) {
  const filename = audioField.replace(/\[sound:(.*?)\]/, '$1');
  const numericId = Object.keys(mediaMap).find(k => mediaMap[k] === filename);
  
  if (numericId) {
    const sourcePath = path.join(unpackedFolder, numericId);
    const destPath = path.join(publicMediaDir, filename);

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      return `<button class="audio-btn" onclick="new Audio('media/${filename}').play()">🔊 Play</button>`;
    }
  }
  
  missingAudio.push(filename);
  return `[Audio missing: ${filename}]`;
}

async function main() {
  const deckPath = path.join(process.cwd(), 'input.apkg');
  const unpackedFolder = path.join(process.cwd(), 'unpacked');

  try {
    console.log("Unpacking and parsing...");
    const apkg = await Apkg.create(deckPath, unpackedFolder);

    const mediaMap = await apkg.getMedia(); // { '1': 'audio.mp3', ... }
    const db = await apkg.getDb();
    const notes = await db.getNotes();

    // Define all possible fields and their sides
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

    // All fields in the order they appear in the apkg (including audio)
    const allFieldsOrder = [
      "word", "wordrom", "worden", "sent", "sentrom", "senten", "pos", "ety", 
      "pronunciation", "senses", "derivedTerms", "wordaudio", "sentaudio", 
      "wiktionary1", "wiktionary2", "wiktionary3", "wiktionary4", "wiktionary5", "wiktionary6"
    ];

    // Track which columns actually have data
    const columnHasData: Record<string, boolean> = {};
    allFieldsOrder.forEach(f => columnHasData[f] = false);

    // Prepare HTML Styles and Scripts
    let html = `<html><head><meta charset="UTF-8"><style>
      body { font-family: sans-serif; padding: 20px; }
      table { border-collapse: collapse; width: 100%; }
      td, th { border: 1px solid #ccc; padding: 8px; transition: background 0.2s; }
      th { background-color: #f2f2f2; text-align: left; }
      .audio-btn { 
        cursor: pointer; padding: 2px 6px; font-size: 10px; 
        background: #eee; border: 1px solid #bbb; border-radius: 4px;
        margin-left: 8px; display: inline-flex; align-items: center;
      }
      .audio-btn:hover { background: #ddd; }
      .controls { margin-bottom: 20px; display: flex; gap: 10px; }
      .btn { padding: 8px 16px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc; background: #fff; }
      .btn:hover { background: #f0f0f0; }
      
      /* Visibility Logic */
      .hide-front [data-side="front"] { background-color: black !important; color: black !important; }
      .hide-back [data-side="back"] { background-color: black !important; color: black !important; }
      [data-local-hide="reveal"] { background-color: white !important; color: initial !important; }
    </style></head><body>
    <div class="controls">
      <button class="btn" onclick="document.body.classList.toggle('hide-front')">Show/Hide Front</button>
      <button class="btn" onclick="document.body.classList.toggle('hide-back')">Show/Hide Back</button>
    </div>
    <script>
      function revealCell(cell) {
        cell.dataset.localHide = 'reveal';
      }
    </script>
    <table>`;

    // Ensure media folder exists
    const publicMediaDir = path.join(process.cwd(), 'media');
    if (!fs.existsSync(publicMediaDir)) fs.mkdirSync(publicMediaDir);

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
          if (audioField) val += renderAudioBtn(audioField, mediaMap, unpackedFolder, publicMediaDir, missingAudio);
        } else if (name === 'sent') {
          const audioField = fieldMap['sentaudio'];
          if (audioField) val += renderAudioBtn(audioField, mediaMap, unpackedFolder, publicMediaDir, missingAudio);
        }
        
        rowData[name] = val;
      }
      processedNotes.push(rowData);
    }

    const finalHeaders = Object.keys(fieldConfig).filter(h => columnHasData[h]);

    html += `<thead><tr>${finalHeaders.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;

    for (const row of processedNotes) {
      html += `<tr>`;
      for (const header of finalHeaders) {
        let val = row[header];
        if (header.startsWith('wiktionary') && val) {
          val = `<details><summary>View</summary>${val}</details>`;
        }
        const side = fieldConfig[header].side;
        html += `<td data-side="${side}" onclick="revealCell(this)">${val}</td>`;
      }
      html += `</tr>`;
    }

    html += `</tbody></table></body></html>`;
    await Bun.write("output.html", html);
    console.log("Success! Open output.html");

    if (missingAudio.length > 0) {
      console.error("\nMissing Audio Files:");
      const uniqueMissing = [...new Set(missingAudio)];
      uniqueMissing.forEach(f => console.error(`- ${f}`));
      throw new Error(`${uniqueMissing.length} audio file(s) were not found in the unpacked directory.`);
    }
  } catch (e) {
    console.error('Error parsing apkg:', e);
  }
}

main();
