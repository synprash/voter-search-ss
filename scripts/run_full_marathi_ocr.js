const fs = require('fs');
const { execSync } = require('child_process');
const { Client } = require('pg');

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

async function main() {
  console.log('=== STARTING DIRECT TESSERACT OCR ON MARATHI PDF (BOOTH 157) ===');
  
  const extractedMap = {}; // serialNo -> { name, relName, relType, houseNo }
  let currentSerial = 1;

  for (let pageNum = 3; pageNum <= 25; pageNum++) {
    const pagePath = `/private/tmp/booth157_pages/page_${pageNum}.jpg`;
    if (!fs.existsSync(pagePath)) continue;

    process.stdout.write(`OCR on Page ${pageNum} / 25... `);
    const start = Date.now();

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

    let pageCount = 0;
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 3; c++) {
        if (currentSerial > 659) break;
        const key = `${r}_${c}`;
        const words = cells[key];
        if (words && words.length > 3) {
          const parsed = parseBox(words);
          extractedMap[currentSerial] = parsed;
          pageCount++;
          currentSerial++;
        }
      }
      if (currentSerial > 659) break;
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`Extracted ${pageCount} electors (${elapsed}s) -> Total so far: ${currentSerial - 1}`);
  }

  console.log(`\nSuccessfully OCR-extracted ${Object.keys(extractedMap).length} voters from Marathi PDF!`);

  // Load existing seed data
  const voters = JSON.parse(fs.readFileSync('src/lib/data/seed-voters.json', 'utf8'));
  const b157 = voters.filter(v => v.part_no === 157);

  let updatedCount = 0;
  for (const v of b157) {
    const ocr = extractedMap[v.serial_no];
    if (ocr) {
      if (ocr.name) v.voter_name_mr = ocr.name;
      if (ocr.relName) v.relative_name_mr = ocr.relName;
      if (ocr.relType) {
        v.relation_type_mr = ocr.relType;
        v.relation_type_en = ocr.relType === 'पती' ? 'Husband' : (ocr.relType === 'आई' ? 'Mother' : 'Father');
      }
      if (ocr.houseNo && ocr.houseNo !== '-') v.house_no = ocr.houseNo;
      updatedCount++;
    }
  }

  fs.writeFileSync('src/lib/data/seed-voters.json', JSON.stringify(voters, null, 2));
  console.log(`Updated seed-voters.json with ${updatedCount} direct OCR Marathi records!`);

  // Print sample records
  console.log('\n--- SAMPLE EXTRACTED VOTERS ---');
  [1, 2, 3, 50, 100, 200, 400, 600].forEach(sn => {
    const v = b157.find(x => x.serial_no === sn);
    if (v) {
      console.log(`[#${v.serial_no}] EN: ${v.voter_name_en} | MR (OCR): ${v.voter_name_mr} | Rel: ${v.relation_type_mr} ${v.relative_name_mr} | EPIC: ${v.epic_no}`);
    }
  });

  // Update Supabase Database
  console.log('\nConnecting to Supabase PostgreSQL...');
  const poolerUrl = 'postgresql://postgres.sgwkdsyzpjwvqnsoxnuq:KCk3%2F%26w6.K%2AKV%2F%21@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';
  const client = new Client({ connectionString: poolerUrl, ssl: { rejectUnauthorized: false } });

  await client.connect();
  console.log('Connected to Supabase! Updating database with exact Tesseract OCR results...');

  const chunkSize = 50;
  for (let i = 0; i < b157.length; i += chunkSize) {
    const chunk = b157.slice(i, i + chunkSize);
    const nameCases = chunk.map(v => `WHEN id = '${v.id}' THEN '${v.voter_name_mr.replace(/'/g, "''")}'`).join(' ');
    const relCases = chunk.map(v => `WHEN id = '${v.id}' THEN '${v.relative_name_mr.replace(/'/g, "''")}'`).join(' ');
    const typeCases = chunk.map(v => `WHEN id = '${v.id}' THEN '${v.relation_type_mr.replace(/'/g, "''")}'`).join(' ');
    const ids = chunk.map(v => `'${v.id}'`).join(',');

    const sql = `UPDATE voters SET
      voter_name_mr = CASE ${nameCases} END,
      relative_name_mr = CASE ${relCases} END,
      relation_type_mr = CASE ${typeCases} END
      WHERE id IN (${ids});`;

    await client.query(sql);
    process.stdout.write(`Persisted ${Math.min(i + chunkSize, b157.length)} / ${b157.length} to Supabase...\r`);
  }

  console.log('\nFinished updating Supabase with direct Tesseract Marathi OCR data!');
  await client.end();
}

main().catch(err => {
  console.error('OCR pipeline failed:', err);
  process.exit(1);
});
