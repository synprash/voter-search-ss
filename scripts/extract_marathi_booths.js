const fs = require('fs');
const { execSync } = require('child_process');
const https = require('https');

function clean(str) {
  return (str || '')
    .replace(/घर\s*क्रमा[ंक]+.*/g, '')
    .replace(/छायाचित्र.*/g, '')
    .replace(/वय\s*[:;]?\s*\d+.*/g, '')
    .replace(/[-_\|\:;\[\]\(\)\{\}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseBox(words) {
  const fullText = words.map(w => w.text).join(' ');
  
  let name = '';
  let relName = '';
  let relType = 'वडील';
  let houseNo = '';

  const nameMatch = fullText.match(/नाव\s*[:;]\s*(.*?)(?=(?:वडिलांचे|पतीचे|आईचे|इतर)\s*नाव|घर\s*क्रमा|वय|$)/);
  if (nameMatch) {
    name = clean(nameMatch[1]);
  }

  const relMatch = fullText.match(/(वडिलांचे|पतीचे|आईचे|इतर)\s*नाव\s*[:;]\s*(.*?)(?=घर\s*क्रमा|वय|छायाचित्र|$)/);
  if (relMatch) {
    relType = relMatch[1] === 'पतीचे' ? 'पती' : (relMatch[1] === 'आईचे' ? 'आई' : 'वडील');
    relName = clean(relMatch[2]);
  }

  const houseMatch = fullText.match(/घर\s*क्रमा[ंक]+\s*[:;]?\s*(.*?)(?=वय|लिंग|छायाचित्र|$)/);
  if (houseMatch) {
    houseNo = clean(houseMatch[1]).replace(/^[-\s]+/, '');
  }

  return { name, relName, relType, houseNo, fullText };
}

function transliterateOne(text) {
  if (!text || text.trim() === '' || text.trim() === '—') return Promise.resolve(text || '');
  const url = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=mr-t-i0-und&num=1`;
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed[0] === 'SUCCESS' && parsed[1] && parsed[1][0] && parsed[1][0][1] && parsed[1][0][1][0]) {
            resolve(parsed[1][0][1][0]);
          } else {
            resolve(text);
          }
        } catch {
          resolve(text);
        }
      });
    }).on('error', () => resolve(text));
  });
}

async function processBooth(b) {
  console.log(`\n========================================`);
  console.log(`PROCESSING MARATHI OCR FOR BOOTH ${b}`);
  console.log(`========================================`);

  const enRawPath = `src/lib/data/booth-${b}-english-raw.json`;
  const enVoters = JSON.parse(fs.readFileSync(enRawPath, 'utf8'));
  console.log(`English source has ${enVoters.length} electors.`);

  const pageDir = `/private/tmp/booth_${b}_pages`;
  const pageFiles = fs.readdirSync(pageDir)
    .filter(f => f.startsWith('page_') && f.endsWith('.jpg'))
    .sort((a, b) => {
      const na = parseInt(a.replace('page_', '').replace('.jpg', ''), 10);
      const nb = parseInt(b.replace('page_', '').replace('.jpg', ''), 10);
      return na - nb;
    });

  console.log(`Found ${pageFiles.length} rendered pages for Booth ${b}. Running Tesseract OCR...`);

  const extractedMap = {}; // serialNo -> { name, relName, relType, houseNo }
  let currentSerial = 1;
  const maxSerial = enVoters.length;

  for (const pf of pageFiles) {
    const pagePath = `${pageDir}/${pf}`;
    const pageNum = pf.replace('page_', '').replace('.jpg', '');

    try {
      const tsv = execSync(`/opt/homebrew/bin/tesseract "${pagePath}" stdout -l mar tsv`, {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024
      });

      const lines = tsv.split('\n').filter(l => l.startsWith('5\t'));
      const cells = {};

      for (const line of lines) {
        const parts = line.split('\t');
        const left = parseInt(parts[6], 10);
        const top = parseInt(parts[7], 10);
        const text = parts[11]?.trim();
        if (!text || top < 95 || top > 2750) continue;

        const col = Math.min(2, Math.max(0, Math.floor((left - 45) / 625)));
        const row = Math.min(9, Math.max(0, Math.floor((top - 95) / 260)));
        const key = `${row}_${col}`;
        if (!cells[key]) cells[key] = [];
        cells[key].push({ text, top, left });
      }

      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 3; c++) {
          if (currentSerial > maxSerial) break;
          const key = `${r}_${c}`;
          const words = cells[key];
          if (words && words.length > 3) {
            const parsed = parseBox(words);
            extractedMap[currentSerial] = parsed;
            currentSerial++;
          }
        }
        if (currentSerial > maxSerial) break;
      }
      process.stdout.write(`Page ${pageNum} done -> Processed ${currentSerial - 1} / ${maxSerial}\r`);
    } catch (err) {
      console.error(`Error on page ${pageNum}:`, err.message);
    }
  }

  console.log(`\nTesseract extracted ${Object.keys(extractedMap).length} / ${maxSerial} records.`);

  // Validate and fill any missing with high-quality transliteration
  console.log(`Verifying and completing missing fields via Indic engine...`);
  const marathiFinal = [];

  for (let sn = 1; sn <= maxSerial; sn++) {
    const en = enVoters[sn - 1] || {};
    let mr = extractedMap[sn];

    let mrName = mr?.name;
    let mrRel = mr?.relName;
    let mrType = mr?.relType || (en.relationType?.toLowerCase().includes('husband') ? 'पती' : (en.relationType?.toLowerCase().includes('mother') ? 'आई' : 'वडील'));
    let houseNo = mr?.houseNo || en.houseNo || '';

    // If OCR missed the name or got too few Devanagari characters, transliterate from English
    if (!mrName || mrName.length < 3 || !/[\u0900-\u097F]/.test(mrName)) {
      if (en.name) {
        mrName = await transliterateOne(en.name);
      }
    }
    if (!mrRel || mrRel.length < 3 || !/[\u0900-\u097F]/.test(mrRel)) {
      if (en.relativeName) {
        mrRel = await transliterateOne(en.relativeName);
      }
    }

    marathiFinal.push({
      serialNo: sn,
      name: mrName || en.name || '',
      relativeName: mrRel || en.relativeName || '',
      relationType: mrType,
      houseNo: houseNo
    });
  }

  const outPath = `src/lib/data/booth-${b}-marathi-raw.json`;
  fs.writeFileSync(outPath, JSON.stringify(marathiFinal, null, 2));
  console.log(`Saved ${marathiFinal.length} Marathi records to ${outPath}!`);
}

async function run() {
  const booths = [145, 146, 147, 148, 149, 150];
  for (const b of booths) {
    await processBooth(b);
  }
  console.log('\n========================================');
  console.log('ALL 6 BOOTHS MARATHI OCR COMPLETE!');
  console.log('========================================');
}

run();
