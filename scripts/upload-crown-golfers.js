const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI';

const supabase = createClient(supabaseUrl, supabaseKey);

const golfersList = [
  { firstName: "Tim", lastName: "HART" },
  { firstName: "Jak", lastName: "CARTER" },
  { firstName: "Jack", lastName: "YULE" },
  { firstName: "James", lastName: "CONRAN" },
  { firstName: "Blake", lastName: "PROVERBS" },
  { firstName: "Adri", lastName: "ARNAUS" },
  { firstName: "Matthew", lastName: "BALDWIN" },
  { firstName: "Davis", lastName: "BRYANT" },
  { firstName: "Alexander", lastName: "SIMPSON" },
  { firstName: "Rafael", lastName: "CAMPOS" },
  { firstName: "Richard", lastName: "GREEN" },
  { firstName: "Curtis", lastName: "LUCK" },
  { firstName: "Jordan", lastName: "DOULL" },
  { firstName: "Nathan", lastName: "KIMSEY" },
  { firstName: "Haydn", lastName: "BARRON" },
  { firstName: "David", lastName: "MICHELUZZI" },
  { firstName: "Oliver", lastName: "BEKKER" },
  { firstName: "Eddie", lastName: "PEPPERELL" },
  { firstName: "Ben", lastName: "CAMPBELL" },
  { firstName: "Freddy", lastName: "SCHOTT" },
  { firstName: "Adam", lastName: "BLAND" },
  { firstName: "Mike", lastName: "TOOROP" },
  { firstName: "John", lastName: "SENDEN" },
  { firstName: "Michael", lastName: "WRIGHT" },
  { firstName: "Daniel", lastName: "YOUNG" },
  { firstName: "Joshua", lastName: "BERRY" },
  { firstName: "Tyler", lastName: "HODGE" },
  { firstName: "Rod", lastName: "PAMPLING" },
  { firstName: "Brett", lastName: "RUMFORD" },
  { firstName: "Fifa", lastName: "LAOPAKDEE" },
  { firstName: "Ben", lastName: "HENKEL" },
  { firstName: "William", lastName: "BRUYERES" },
  { firstName: "Gregorio", lastName: "DE LEO" },
  { firstName: "Sadom", lastName: "KAEWKANJANA" },
  { firstName: "Andres German", lastName: "GALLEGOS" },
  { firstName: "Corey", lastName: "LAMB" },
  { firstName: "Siddharth", lastName: "NADIMPALLI" },
  { firstName: "Andrew", lastName: "EVANS" },
  { firstName: "Blake", lastName: "PHILLIPS" },
  { firstName: "Matias", lastName: "SANCHEZ" },
  { firstName: "Austin", lastName: "BAUTISTA" },
  { firstName: "Jeff", lastName: "GUAN" },
  { firstName: "Alex", lastName: "FITZPATRICK" },
  { firstName: "Geoff", lastName: "OGILVY" },
  { firstName: "Ryan", lastName: "PEAKE" },
  { firstName: "Adam", lastName: "SCOTT" },
  { firstName: "Min Woo", lastName: "LEE" },
  { firstName: "Rory", lastName: "MCILROY" },
  { firstName: "Elvis", lastName: "SMYLIE" },
  { firstName: "Danny", lastName: "WILLETT" },
  { firstName: "Cam", lastName: "SMITH" },
  { firstName: "Joel", lastName: "GIRRBACH" },
  { firstName: "Marc", lastName: "LEISHMAN" },
  { firstName: "Ugo", lastName: "COUSSAUD" },
  { firstName: "Charley", lastName: "HOFFMAN" },
  { firstName: "Harrison", lastName: "CROWE" },
  { firstName: "Sebastian", lastName: "MUNOZ" },
  { firstName: "Nick", lastName: "VOKE" },
  { firstName: "Caleb", lastName: "SURRATT" },
  { firstName: "Andrew", lastName: "MARTIN" },
  { firstName: "Jordan", lastName: "GUMBERG" },
  { firstName: "Jack", lastName: "THOMPSON" },
  { firstName: "Andrew", lastName: "JOHNSTON" },
  { firstName: "Quim", lastName: "VIDAL" },
  { firstName: "Josh", lastName: "GEARY" },
  { firstName: "Connor", lastName: "MCKINNEY" },
  { firstName: "James", lastName: "MARCHESANI" },
  { firstName: "Quinnton", lastName: "CROKER" },
  { firstName: "Hunter", lastName: "LOGAN" },
  { firstName: "Jasper", lastName: "STUBBS" },
  { firstName: "Andreas", lastName: "HALVORSEN" },
  { firstName: "Filippo", lastName: "CELLI" },
  { firstName: "Chris", lastName: "MALEC" },
  { firstName: "Will", lastName: "FLORIMO" },
  { firstName: "Jay", lastName: "MACKENZIE" },
  { firstName: "Andrew", lastName: "CAMPBELL" },
  { firstName: "Yannik", lastName: "PAUL" },
  { firstName: "Fabrizio", lastName: "ZANOTTI" },
  { firstName: "Anthony", lastName: "QUAYLE" },
  { firstName: "Karl", lastName: "VILIPS" },
  { firstName: "Jason", lastName: "SCRIVENER" },
  { firstName: "Jose Luis", lastName: "BALLESTER" },
  { firstName: "Matt", lastName: "MCCARTY" },
  { firstName: "Romain", lastName: "LANGASQUE" },
  { firstName: "Ryan", lastName: "FOX" },
  { firstName: "Si Woo", lastName: "KIM" },
  { firstName: "Joaquin", lastName: "NIEMANN" },
  { firstName: "Lucas", lastName: "HERBERT" },
  { firstName: "Daniel", lastName: "HILLIER" },
  { firstName: "David", lastName: "PUIG" },
  { firstName: "Cam", lastName: "DAVIS" },
  { firstName: "Abraham", lastName: "ANCER" },
  { firstName: "Rasmus", lastName: "NEERGAARD-PETERSEN" },
  { firstName: "Wenyi", lastName: "DING" },
  { firstName: "Matt", lastName: "JONES" },
  { firstName: "Ryo", lastName: "HISATSUNE" },
  { firstName: "Rafa", lastName: "CABRERA BELLO" },
  { firstName: "Jye", lastName: "HALLS" },
  { firstName: "Kazuma", lastName: "KOBORI" },
  { firstName: "Carlos", lastName: "ORTIZ" },
  { firstName: "Bernd", lastName: "WIESBERGER" },
  { firstName: "Wade", lastName: "ORMSBY" },
  { firstName: "Jack", lastName: "BUCHANAN" },
  { firstName: "Tom", lastName: "VAILLANT" },
  { firstName: "Maximilian", lastName: "STEINLECHNER" },
  { firstName: "Lachlan", lastName: "BARKER" },
  { firstName: "Matthew", lastName: "GRIFFIN" },
  { firstName: "Stefano", lastName: "MAZZOLI" },
  { firstName: "Benjamin", lastName: "FOLLETT-SMITH" },
  { firstName: "Dylan", lastName: "GARDNER" },
  { firstName: "Rocco", lastName: "REPETTO TAYLOR" },
  { firstName: "Jack", lastName: "MUNRO" },
  { firstName: "Robin", lastName: "WILLIAMS" },
  { firstName: "Ryan", lastName: "VAN VELZEN" },
  { firstName: "Tapio", lastName: "PULKKANEN" },
  { firstName: "Nathan", lastName: "BARBIERI" },
  { firstName: "Jason", lastName: "NORRIS" },
  { firstName: "Jack", lastName: "SENIOR" },
  { firstName: "Jake", lastName: "MCLEOD" },
  { firstName: "Aaron", lastName: "COCKERILL" }
];

async function uploadCrownGolfers() {
  console.log('\n⛳ Uploading golfers to Crown Australian Open...\n');
  
  // Get tournament
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name')
    .ilike('name', '%Crown Australian Open%')
    .single();
  
  if (!tournament) {
    console.error('❌ Crown Australian Open tournament not found');
    return;
  }
  
  console.log(`✅ Found tournament: ${tournament.name}`);
  console.log(`   ID: ${tournament.id}\n`);
  
  let added = 0;
  let existing = 0;
  let created = 0;
  
  for (const golfer of golfersList) {
    const fullName = `${golfer.lastName}, ${golfer.firstName}`;
    
    // Check if golfer exists
    let { data: existingGolfer } = await supabase
      .from('golfers')
      .select('id')
      .eq('name', fullName)
      .single();
    
    let golferId;
    
    if (!existingGolfer) {
      // Create new golfer
      const { data: newGolfer, error: createError } = await supabase
        .from('golfers')
        .insert({
          name: fullName,
          first_name: `${golfer.lastName},`,
          last_name: golfer.firstName,
          salary_pennies: 10000,
          ranking_source: 'manual'
        })
        .select()
        .single();
      
      if (createError) {
        console.error(`  ❌ Failed to create ${fullName}:`, createError.message);
        continue;
      }
      
      golferId = newGolfer.id;
      created++;
      console.log(`  ➕ Created: ${fullName}`);
    } else {
      golferId = existingGolfer.id;
      existing++;
    }
    
    // Add to tournament
    const { error: tournamentError } = await supabase
      .from('tournament_golfers')
      .upsert({
        tournament_id: tournament.id,
        golfer_id: golferId
      }, {
        onConflict: 'tournament_id,golfer_id',
        ignoreDuplicates: true
      });
    
    if (!tournamentError) {
      added++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   New golfers created: ${created}`);
  console.log(`   Existing golfers: ${existing}`);
  console.log(`   Total added to tournament: ${added}`);
  console.log(`\n✅ Done!\n`);
}

uploadCrownGolfers();
