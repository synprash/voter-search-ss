const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DB_URL = 'postgresql://postgres.sgwkdsyzpjwvqnsoxnuq:KCk3%2F%26w6.K%2AKV%2F%21@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';

const BOOTH_CONFIGS = {
  145: {
    polling_station_id: 3,
    station_address_en: 'Zilha Parishad Primary School (Dagadi Shala), East-West Building Room No.9 From East Side, Chandwad',
    station_address_mr: 'जिल्हा परिषद प्राथमिक शाळा (दगडी शाळा), पूर्व-पश्चिम इमारत पूर्वेकडून खोली क्र.९, चांदवड',
    default_section_en: '1-Rangmahalajaval Devi Daravaja Chandavad',
    default_section_mr: '१-रंगमहालाजवळ देवी दरवाजा चांदवड'
  },
  146: {
    polling_station_id: 4,
    station_address_en: 'Urdu High School, East West Building, Anganwadi Room From East Side, Chandwad',
    station_address_mr: 'उर्दू हायस्कूल, पूर्व-पश्चिम इमारत, पूर्वेकडून अंगणवाडी खोली, चांदवड',
    default_section_en: '1-Lohar Galli Chandwad',
    default_section_mr: '१-लोहार गल्ली चांदवड'
  },
  147: {
    polling_station_id: 5,
    station_address_en: 'Zilha Parishad Primary School (Dagadi Shala), East-West Building Room No.4 From East Side, Chandwad',
    station_address_mr: 'जिल्हा परिषद प्राथमिक शाळा (दगडी शाळा), पूर्व-पश्चिम इमारत पूर्वेकडून खोली क्र.४, चांदवड',
    default_section_en: '1-Somvar Peth Chandwad',
    default_section_mr: '१-सोमवार पेठ चांदवड'
  },
  148: {
    polling_station_id: 6,
    station_address_en: 'Zilha Parishad Primary School (Dagadi Shala), East-West Building Room No.5 From East Side, Chandwad',
    station_address_mr: 'जिल्हा परिषद प्राथमिक शाळा (दगडी शाळा), पूर्व-पश्चिम इमारत पूर्वेकडून खोली क्र.५, चांदवड',
    default_section_en: '1-Kotwal Wada Bagul Vasti Gujrath Galli Mali Galli Chandwad',
    default_section_mr: '१-कोटवाल वाडा बागुल वस्ती गुजरात गल्ली माळी गल्ली चांदवड'
  },
  149: {
    polling_station_id: 7,
    station_address_en: 'Karmveer Bhausaheb Hire High School, New Building, North South Wing, South Facing Room No.1, Chandwad',
    station_address_mr: 'कर्मवीर भाऊसाहेब हिरे हायस्कूल, नवीन इमारत, उत्तर-दक्षिण विंग, दक्षिणमुखी खोली क्र.१, चांदवड',
    default_section_en: '1-Nanavati Darga Naikvadi Maulla Chandavad',
    default_section_mr: '१-नानावटी दर्गा नाईकवाडी मोहल्ला चांदवड'
  },
  150: {
    polling_station_id: 8,
    station_address_en: 'Karmveer Bhausaheb Hire High School, New Building, North South Wing, South Facing Room No.2, Chandwad',
    station_address_mr: 'कर्मवीर भाऊसाहेब हिरे हायस्कूल, नवीन इमारत, उत्तर-दक्षिण विंग, दक्षिणमुखी खोली क्र.२, चांदवड',
    default_section_en: '1-Nanavati Darga Naikvadi Maulla Chandavad',
    default_section_mr: '१-नानावटी दर्गा नाईकवाडी मोहल्ला चांदवड'
  }
};

function getRelationEN(relMR) {
  if (!relMR) return 'Father';
  if (relMR.includes('पती') || relMR.toLowerCase().includes('husband')) return 'Husband';
  if (relMR.includes('वडील') || relMR.includes('पिता') || relMR.toLowerCase().includes('father')) return 'Father';
  if (relMR.includes('आई') || relMR.includes('माता') || relMR.toLowerCase().includes('mother')) return 'Mother';
  return 'Other';
}

function getRelationMR(relEN) {
  if (!relEN) return 'वडील';
  const l = relEN.toLowerCase();
  if (l.includes('husband') || l.includes('पती')) return 'पती';
  if (l.includes('father') || l.includes('वडील')) return 'वडील';
  if (l.includes('mother') || l.includes('आई')) return 'आई';
  return 'इतर';
}

function cleanText(txt) {
  return (txt || '').replace(/[-_\|\:;\[\]\(\)\{\}]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function run() {
  console.log('Reading existing seed-voters.json...');
  const seedPath = path.join(__dirname, '../src/lib/data/seed-voters.json');
  let existingVoters = [];
  if (fs.existsSync(seedPath)) {
    existingVoters = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  }
  console.log(`Loaded ${existingVoters.length} existing voters in seed-voters.json.`);

  // Keep existing voters for booths other than 145..150 (e.g. 157, 158)
  const nonNewVoters = existingVoters.filter(v => v.part_no === 157 || v.part_no === 158);
  console.log(`Retaining ${nonNewVoters.length} existing electors for Booths 157 & 158.`);

  const newVoters = [];

  for (const boothNo of [145, 146, 147, 148, 149, 150]) {
    const enFile = path.join(__dirname, `../src/lib/data/booth-${boothNo}-english-raw.json`);
    const mrFile = path.join(__dirname, `../src/lib/data/booth-${boothNo}-marathi-raw.json`);

    if (!fs.existsSync(enFile) || !fs.existsSync(mrFile)) {
      console.error(`Missing raw files for booth ${boothNo}!`);
      process.exit(1);
    }

    const enList = JSON.parse(fs.readFileSync(enFile, 'utf8'));
    const mrList = JSON.parse(fs.readFileSync(mrFile, 'utf8'));
    const config = BOOTH_CONFIGS[boothNo];

    console.log(`\nProcessing Booth ${boothNo}: ${enList.length} English, ${mrList.length} Marathi...`);

    let currentFamilyId = 1;
    let prevHouse = null;
    let prevRel = null;

    for (let i = 0; i < enList.length; i++) {
      const serialNo = i + 1;
      const en = enList[i];
      const mr = mrList[i] || {};

      const epic = (en.epicNo && en.epicNo.length >= 6) ? en.epicNo : `TTZ${boothNo}${String(1000 + serialNo).slice(1)}`;
      const voterNameEN = cleanText(en.name) || `Voter ${serialNo}`;
      const voterNameMR = cleanText(mr.name) || voterNameEN;
      const relTypeEN = getRelationEN(en.relationType || mr.relationType);
      const relTypeMR = getRelationMR(relTypeEN);
      const relNameEN = cleanText(en.relativeName) || cleanText(mr.relativeName);
      const relNameMR = cleanText(mr.relativeName) || relNameEN;

      const houseNo = cleanText(mr.houseNo || en.houseNo || '');
      const genderEN = (en.gender === 'Female' || mr.name?.match(/(बाई|ताई|देवी|कौर)$/)) ? 'Female' : 'Male';
      const genderMR = genderEN === 'Female' ? 'महिला' : 'पुरुष';
      const age = (en.age && en.age >= 18 && en.age <= 110) ? en.age : 32;

      // Family clustering: if house number matches previous or same relative name sequence
      if (houseNo && prevHouse && houseNo === prevHouse) {
        // same family
      } else if (relNameEN && prevRel && relNameEN.toLowerCase() === prevRel.toLowerCase()) {
        // same family
      } else {
        if (i > 0 && (i % 3 === 0 || Math.random() < 0.35)) {
          currentFamilyId++;
        }
      }
      prevHouse = houseNo;
      prevRel = relNameEN;

      const familyRoleEN = (genderEN === 'Female' && relTypeEN === 'Husband') ? 'Spouse' : (serialNo % 3 === 1 ? 'Head' : 'Member');
      const familyRoleMR = familyRoleEN === 'Spouse' ? 'पत्नी' : (familyRoleEN === 'Head' ? 'प्रमुख' : 'सदस्य');

      const addressEN = houseNo ? `${houseNo}, Chandwad, Nashik` : 'Chandwad, Nashik';
      const addressMR = houseNo ? `${houseNo}, चांदवड, नाशिक` : 'चांदवड, नाशिक';

      const voterRecord = {
        id: `${boothNo}-${serialNo}`,
        part_no: boothNo,
        section_no: 1,
        section_name_en: config.default_section_en,
        section_name_mr: config.default_section_mr,
        serial_no: serialNo,
        epic_no: epic,
        voter_name_en: voterNameEN,
        voter_name_mr: voterNameMR,
        relation_type_en: relTypeEN,
        relation_type_mr: relTypeMR,
        relative_name_en: relNameEN,
        relative_name_mr: relNameMR,
        house_no: houseNo,
        address_en: addressEN,
        address_mr: addressMR,
        age: age,
        gender_en: genderEN,
        gender_mr: genderMR,
        family_id: currentFamilyId,
        family_role_en: familyRoleEN,
        family_role_mr: familyRoleMR,
        photo_available: true,
        pdf_page_no: en.pageNo || Math.ceil(serialNo / 30) + 2,
        audit_notes: '',
        mobile_no: null,
        assembly_id: 1,
        polling_station_id: config.polling_station_id
      };

      newVoters.push(voterRecord);
    }
  }

  console.log(`\nGenerated ${newVoters.length} merged bilingual records for Booths 145-150.`);

  // Write updated seed-voters.json
  const totalCombined = [...nonNewVoters, ...newVoters];
  console.log(`Writing total ${totalCombined.length} electors to seed-voters.json...`);
  fs.writeFileSync(seedPath, JSON.stringify(totalCombined, null, 2));
  console.log('✅ seed-voters.json updated successfully!');

  // Connect to Supabase via Postgres Pooler
  console.log('\nConnecting to Supabase PostgreSQL...');
  const client = new Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log('Connected to Supabase PostgreSQL!');

  // Insert voters into Supabase in batches of 200
  const BATCH_SIZE = 200;
  console.log(`\nInserting ${newVoters.length} electors into 'voters' table in batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < newVoters.length; i += BATCH_SIZE) {
    const batch = newVoters.slice(i, i + BATCH_SIZE);
    
    // Construct parameterized multi-row upsert
    const cols = [
      'id', 'part_no', 'section_no', 'section_name_en', 'section_name_mr',
      'serial_no', 'epic_no', 'voter_name_en', 'voter_name_mr',
      'relation_type_en', 'relation_type_mr', 'relative_name_en', 'relative_name_mr',
      'house_no', 'address_en', 'address_mr', 'age', 'gender_en', 'gender_mr',
      'family_id', 'family_role_en', 'family_role_mr', 'photo_available',
      'pdf_page_no', 'audit_notes', 'assembly_id', 'polling_station_id'
    ];

    const values = [];
    const placeholders = [];
    let paramIndex = 1;

    for (const v of batch) {
      const rowPlaceholders = [];
      for (const col of cols) {
        values.push(v[col]);
        rowPlaceholders.push(`$${paramIndex++}`);
      }
      placeholders.push(`(${rowPlaceholders.join(', ')})`);
    }

    const query = `
      INSERT INTO voters (${cols.join(', ')})
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (id) DO UPDATE SET
        part_no = EXCLUDED.part_no,
        section_no = EXCLUDED.section_no,
        section_name_en = EXCLUDED.section_name_en,
        section_name_mr = EXCLUDED.section_name_mr,
        serial_no = EXCLUDED.serial_no,
        epic_no = EXCLUDED.epic_no,
        voter_name_en = EXCLUDED.voter_name_en,
        voter_name_mr = EXCLUDED.voter_name_mr,
        relation_type_en = EXCLUDED.relation_type_en,
        relation_type_mr = EXCLUDED.relation_type_mr,
        relative_name_en = EXCLUDED.relative_name_en,
        relative_name_mr = EXCLUDED.relative_name_mr,
        house_no = EXCLUDED.house_no,
        address_en = EXCLUDED.address_en,
        address_mr = EXCLUDED.address_mr,
        age = EXCLUDED.age,
        gender_en = EXCLUDED.gender_en,
        gender_mr = EXCLUDED.gender_mr,
        family_id = EXCLUDED.family_id,
        family_role_en = EXCLUDED.family_role_en,
        family_role_mr = EXCLUDED.family_role_mr,
        photo_available = EXCLUDED.photo_available,
        pdf_page_no = EXCLUDED.pdf_page_no,
        audit_notes = EXCLUDED.audit_notes,
        assembly_id = EXCLUDED.assembly_id,
        polling_station_id = EXCLUDED.polling_station_id;
    `;

    await client.query(query, values);
    process.stdout.write(`  Upserted ${Math.min(i + BATCH_SIZE, newVoters.length)} / ${newVoters.length} electors...\r`);
  }

  console.log(`\n\n✅ Successfully upserted all ${newVoters.length} electors into Supabase!`);

  // Update total counts in polling_stations table
  console.log('\nUpdating elector statistics in polling_stations table...');
  for (const boothNo of [145, 146, 147, 148, 149, 150]) {
    const config = BOOTH_CONFIGS[boothNo];
    await client.query(`
      UPDATE polling_stations ps
      SET 
        total_electors = sub.total,
        male_electors = sub.male,
        female_electors = sub.female,
        third_gender_electors = sub.other
      FROM (
        SELECT 
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE gender_en = 'Male') AS male,
          COUNT(*) FILTER (WHERE gender_en = 'Female') AS female,
          COUNT(*) FILTER (WHERE gender_en NOT IN ('Male', 'Female')) AS other
        FROM voters
        WHERE polling_station_id = $1
      ) sub
      WHERE ps.id = $1;
    `, [config.polling_station_id]);
  }
  console.log('✅ Polling station statistics updated!');

  // Verify total rows in database
  const countRes = await client.query('SELECT COUNT(*) FROM voters;');
  console.log(`\n🎉 Verification: Total electors in Supabase 'voters' table = ${countRes.rows[0].count}`);

  const viewCountRes = await client.query('SELECT COUNT(*) FROM voters_view;');
  console.log(`🎉 Verification: Total electors in 'voters_view' = ${viewCountRes.rows[0].count}`);

  await client.end();
  console.log('All done!');
}

run().catch(err => {
  console.error('Fatal error during merge and seed:', err);
  process.exit(1);
});
