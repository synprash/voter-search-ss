const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local if present
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...rest] = trimmed.split('=');
      const val = rest.join('=').replace(/(^["']|["']$)/g, '');
      if (key && !process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.argv[2];
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.argv[3];

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Missing Supabase credentials!');
  console.error('\nPlease provide them in .env.local or as command-line arguments:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co');
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=<optional-service-role-key-for-admin-write>\n');
  console.error('Usage:');
  console.error('  node scripts/seed-supabase.js <supabase_url> <supabase_key>\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function runSeed() {
  console.log(`\n🚀 Starting database migration to Supabase:`);
  console.log(`   Endpoint: ${supabaseUrl}\n`);

  // 1. Seed Booths
  const boothsPath = path.join(process.cwd(), 'src/lib/data/seed-booths.json');
  const booths = JSON.parse(fs.readFileSync(boothsPath, 'utf8'));
  console.log(`📦 Upserting ${booths.length} Polling Booths / Parts...`);

  const { data: boothData, error: boothError } = await supabase
    .from('booths')
    .upsert(booths, { onConflict: 'assembly_constituency_no,part_no' })
    .select();

  if (boothError) {
    console.error('❌ Error inserting booths:', boothError.message);
    console.error('💡 Make sure you have run the migration SQL in the Supabase SQL Editor first!');
    process.exit(1);
  }
  console.log(`✅ Successfully seeded ${boothData.length} Booths!\n`);

  // 2. Seed Voters
  const votersPath = path.join(process.cwd(), 'src/lib/data/seed-voters.json');
  const voters = JSON.parse(fs.readFileSync(votersPath, 'utf8'));
  console.log(`👥 Upserting ${voters.length} Electors in batches of 100...`);

  const chunkSize = 100;
  let totalInserted = 0;

  for (let i = 0; i < voters.length; i += chunkSize) {
    const chunk = voters.slice(i, i + chunkSize);
    const { error: voterError } = await supabase
      .from('voters')
      .upsert(chunk, { onConflict: 'id' });

    if (voterError) {
      console.error(`❌ Error inserting batch ${i / chunkSize + 1}:`, voterError.message);
      process.exit(1);
    }
    totalInserted += chunk.length;
    const progress = Math.round((totalInserted / voters.length) * 100);
    process.stdout.write(`   [${progress}%] Seeded ${totalInserted} / ${voters.length} electors...\r`);
  }

  console.log(`\n✅ All ${totalInserted} bilingual electors migrated successfully to Supabase!`);
  console.log(`\n🎉 Database migration complete! You can now query your Supabase instance.\n`);
}

runSeed().catch((err) => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});
