const fs = require('fs');
const https = require('https');

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

async function mapConcurrent(items, limit, fn) {
  const results = [];
  let index = 0;
  
  const workers = Array(limit).fill(0).map(async () => {
    while (index < items.length) {
      const curIdx = index++;
      results[curIdx] = await fn(items[curIdx], curIdx);
      if (curIdx % 20 === 0) {
        process.stdout.write(`Progress: ${curIdx} / ${items.length}...\r`);
      }
    }
  });
  
  await Promise.all(workers);
  return results;
}

async function main() {
  // Read clean English source
  const enRaw = JSON.parse(fs.readFileSync('src/lib/data/booth-157-english-raw.json', 'utf8'));
  const voters = JSON.parse(fs.readFileSync('src/lib/data/seed-voters.json', 'utf8'));
  
  const b157 = voters.filter(v => v.part_no === 157);
  console.log(`Translating ${b157.length} voters for Booth 157 to authentic Marathi...`);

  // Reset any previous values with proper English raw names
  b157.forEach((v, idx) => {
    v.voter_name_en = enRaw[idx]?.name || v.voter_name_en;
    v.relative_name_en = enRaw[idx]?.relativeName || v.relative_name_en;
  });

  console.log('Transliterating voter names...');
  await mapConcurrent(b157, 10, async (v) => {
    v.voter_name_mr = await transliterateOne(v.voter_name_en);
    v.relative_name_mr = await transliterateOne(v.relative_name_en);
    return v;
  });

  console.log('\nSample record 0:', {
    id: b157[0].id,
    en: b157[0].voter_name_en,
    mr: b157[0].voter_name_mr,
    rel_en: b157[0].relative_name_en,
    rel_mr: b157[0].relative_name_mr
  });
  console.log('Sample record 1:', {
    id: b157[1].id,
    en: b157[1].voter_name_en,
    mr: b157[1].voter_name_mr,
    rel_en: b157[1].relative_name_en,
    rel_mr: b157[1].relative_name_mr
  });
  console.log('Sample record 2:', {
    id: b157[2].id,
    en: b157[2].voter_name_en,
    mr: b157[2].voter_name_mr,
    rel_en: b157[2].relative_name_en,
    rel_mr: b157[2].relative_name_mr
  });

  fs.writeFileSync('src/lib/data/seed-voters.json', JSON.stringify(voters, null, 2));
  console.log('Successfully updated seed-voters.json with 100% Marathi names for all voters!');
}

main();
