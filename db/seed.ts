// db/seed.ts — idempotent seed. Run: npx tsx db/seed.ts
import { query, execScript, closePool } from '../lib/db/client';
import { SEED_IDS } from './seed-ids';
export { SEED_IDS } from './seed-ids';

function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeEmb(tag: string, jitter: number): string {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = Math.imul(31, h) + tag.charCodeAt(i);
  const br = mulberry32(h >>> 0); const jr = mulberry32(jitter);
  const v = Array.from({ length: 1024 }, () => br() * 2 - 1 + (jr() - 0.5) * 0.15);
  const len = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return '[' + v.map(x => (x / len).toFixed(6)).join(',') + ']';
}

const F = SEED_IDS.fundraisers; const P = SEED_IDS.profiles; const C = SEED_IDS.communities;
const WF = F['realtime-alerts-for-wildfire-safety-r5jkk'];
const BR = F['rebuild-the-lincoln-hs-band-room'];
const DR = F['senior-dog-rescue-winter-shelter'];
const CO = F['first-gen-college-fund-maria'];
const PS = F['wildfire-evacuation-pet-supplies'];
const AQ = F['neighborhood-air-quality-sensors'];
const JN = P.janahan; const SJ = P['sarah-j']; const SK = P['sarah-k'];
const MT = P['mike-t']; const PM = P['priya-m'];
const DO = P['david-okafor']; const LP = P['lena-petrov'];
const JW = P['james-wu']; const AR = P['aisha-rahman'];
const WD = C['watch-duty']; const NC = C['wildfire-relief-norcal'];

const U1='00000000-0000-4000-8000-000000001101',U2='00000000-0000-4000-8000-000000001102',
      U3='00000000-0000-4000-8000-000000001103',UB='00000000-0000-4000-8000-000000001104';
const D01='00000000-0000-4000-8000-000000002001',D02='00000000-0000-4000-8000-000000002002',
      D03='00000000-0000-4000-8000-000000002003',D04='00000000-0000-4000-8000-000000002004',
      D05='00000000-0000-4000-8000-000000002005',D06='00000000-0000-4000-8000-000000002006',
      D07='00000000-0000-4000-8000-000000002007',D08='00000000-0000-4000-8000-000000002008',
      D09='00000000-0000-4000-8000-000000002009',D10='00000000-0000-4000-8000-000000002010',
      D11='00000000-0000-4000-8000-000000002011',D12='00000000-0000-4000-8000-000000002012',
      D13='00000000-0000-4000-8000-000000002013',D14='00000000-0000-4000-8000-000000002014',
      D15='00000000-0000-4000-8000-000000002015',D16='00000000-0000-4000-8000-000000002016',
      DA1='00000000-0000-4000-8000-000000002020',DA2='00000000-0000-4000-8000-000000002021',
      DA3='00000000-0000-4000-8000-000000002022',DA4='00000000-0000-4000-8000-000000002023',
      DA5='00000000-0000-4000-8000-000000002024';
const SH1='00000000-0000-4000-8000-000000003001',SH2='00000000-0000-4000-8000-000000003002',
      SH3='00000000-0000-4000-8000-000000003003',SH4='00000000-0000-4000-8000-000000003004',
      SH5='00000000-0000-4000-8000-000000003005',SH6='00000000-0000-4000-8000-000000003006',
      SH7='00000000-0000-4000-8000-000000003007',SH8='00000000-0000-4000-8000-000000003008';
const A1='00000000-0000-4000-8000-000000004001',A2='00000000-0000-4000-8000-000000004002',
      A3='00000000-0000-4000-8000-000000004003',A4='00000000-0000-4000-8000-000000004004',
      A5='00000000-0000-4000-8000-000000004005',A6='00000000-0000-4000-8000-000000004006',
      A7='00000000-0000-4000-8000-000000004007',A8='00000000-0000-4000-8000-000000004008';
const S1='00000000-0000-4000-8000-000000005001',S2='00000000-0000-4000-8000-000000005002',
      S3='00000000-0000-4000-8000-000000005003',S4='00000000-0000-4000-8000-000000005004',
      S5='00000000-0000-4000-8000-000000005005',S6='00000000-0000-4000-8000-000000005006',
      S7='00000000-0000-4000-8000-000000005007',S8='00000000-0000-4000-8000-000000005008',
      S9='00000000-0000-4000-8000-000000005009',S10='00000000-0000-4000-8000-000000005010';

const da = (n: number) => new Date(Date.now() - n * 86400_000).toISOString();
const sz = (o: number, i: number) => Math.round(40 + 30 * Math.log(1 + o + i));

async function ins(sql: string, p: unknown[]) { await query(sql, p); }

/**
 * Insert all seed rows into the active DB backend.
 * Exported so integration tests can call `seedDatabase()` after applying the schema to a fresh
 * PGlite instance without going through the CLI path.
 */
export async function seedDatabase(): Promise<void> {
  console.log('[db:seed] starting…');
  await execScript(`
    DELETE FROM sun_mark; DELETE FROM donation_attribution; DELETE FROM share_event;
    DELETE FROM reaction; DELETE FROM comment; DELETE FROM follow;
    DELETE FROM community_activity; DELETE FROM community_membership;
    DELETE FROM share_copy; DELETE FROM update_summary; DELETE FROM fundraiser_update;
    DELETE FROM donation; DELETE FROM fundraiser; DELETE FROM community; DELETE FROM profile;
  `);

  // CB-15: cover_image_url seeded for both communities — deterministic picsum URLs (stable across reseeds).
  // CB-24: watch-duty raised_usd=4200000, fundraiser_count=312, follower_count=1247 (v4.2 reference).
  await ins(`INSERT INTO community (id,slug,name,description,raised_usd,fundraiser_count,follower_count,cover_image_url) VALUES
    ($1,'watch-duty','Watch Duty','A community of volunteers coordinating wildfire alerts, evacuation resources, and neighbor safety across Northern California.',4200000,312,1247,'https://picsum.photos/seed/watchduty-cover/1200/675'),
    ($2,'wildfire-relief-norcal','Wildfire Relief NorCal','Regional fundraising network for wildfire survivors: temporary housing, pet care, and rebuilding support.',380000,7,520,'https://picsum.photos/seed/norcal-cover/1200/675')`,
    [WD, NC]);

  await ins(`INSERT INTO profile (id,handle,display_name,bio,joined_year,cause_tags,follower_count,embedding) VALUES
    ($1,'janahan','Janahan Selvarajah',NULL,2015,ARRAY['Animals','Environment','Arts & Culture'],142,$2::vector),
    ($3,'sarah-j','Sarah J.','Wildfire preparedness advocate and community organizer in the Sierra foothills.',2016,ARRAY['Emergencies','Community'],380,$4::vector)`,
    [JN, makeEmb('Community,Education,Animals',1), SJ, makeEmb('Emergencies,Community',2)]);
  await ins(`INSERT INTO profile (id,handle,display_name,bio,joined_year,cause_tags,follower_count,embedding) VALUES
    ($1,'sarah-k','Sarah K.','Passionate about animal welfare and emergency relief.',2018,ARRAY['Animals','Emergencies'],95,$8::vector),
    ($2,'mike-t','Mike T.','Connector and community builder. Always sharing what matters.',2014,ARRAY['Community','Education','Animals'],830,$9::vector),
    ($3,'priya-m','Priya M.','Occasional donor, believer in education equity.',2019,ARRAY['Education'],48,$10::vector),
    ($4,'david-okafor','David Okafor','Youth education advocate and after-school program volunteer.',2017,ARRAY['Education','Community'],211,$11::vector),
    ($5,'lena-petrov','Lena Petrov','Animal shelter volunteer and foster parent.',2016,ARRAY['Animals'],175,$12::vector),
    ($6,'james-wu','James Wu','Environmental health researcher.',2020,ARRAY['Community','Emergencies'],63,$13::vector),
    ($7,'aisha-rahman','Aisha Rahman','Fundraiser organizer for first-generation college students.',2018,ARRAY['Education'],299,$14::vector)`,
    [SK, MT, PM, DO, LP, JW, AR,
     makeEmb('Animals,Emergencies', 20), makeEmb('Community,Education,Animals', 21), makeEmb('Education', 22),
     makeEmb('Education,Community', 23), makeEmb('Animals', 24), makeEmb('Community,Emergencies', 25), makeEmb('Education', 26)]);

  const story = 'Wildfires move fast — and too often, communities do not get the warning they need until it is too late.\n\nOur team has been deploying a network of low-cost sensor nodes and integrating real-time satellite data to push automated alerts directly to residents\' phones the moment conditions turn dangerous. Unlike existing services that rely on county dispatchers, our system operates independently and pushes notifications within 90 seconds of detection.\n\nWe have already piloted this technology in two counties and successfully alerted over 4,200 households during three separate fire events this season. Families got out. Pets were evacuated. No one was caught off guard.\n\nWith your support, we will expand coverage to three additional counties, improve our sensor density in the highest-risk corridors, and build a dedicated 24/7 monitoring station staffed by trained volunteers. Every dollar goes directly to hardware, data infrastructure, and community training.\n\nTogether we can make sure no family is left without warning. Help us light up the next three counties before fire season peaks.';

  await ins(`INSERT INTO fundraiser (id,slug,organizer_id,community_id,title,story,category,goal_usd,raised_usd,donation_count,follower_count,hero_image_url,embedding) VALUES
    ($1,'realtime-alerts-for-wildfire-safety-r5jkk',$2,$3,'Real-Time Alerts for Wildfire Safety',$4,'Emergencies',30000,23400,1247,912,'https://picsum.photos/seed/wildfire/1200/630',$5::vector),
    ($6,'rebuild-the-lincoln-hs-band-room',$7,NULL,'Rebuild the Lincoln High School Band Room','The Lincoln High band room was destroyed in a flash flood last spring. Over 80 students lost their instruments and rehearsal space mid-year. We are fundraising to rebuild the room, replace essential instruments, and restore a program that has sent three students to music conservatories in the past decade.','Education',20000,17200,310,440,'https://picsum.photos/seed/bandroom/1200/630',$8::vector),
    ($9,'senior-dog-rescue-winter-shelter',$10,NULL,'Winter Shelter for Senior Dogs','Forty senior dogs at our no-kill rescue are heading into winter without adequate indoor space. We need to insulate the old barn, add heated flooring, and hire an overnight care technician. Senior dogs are the least likely to be adopted and the most vulnerable to cold.','Animals',15000,8400,178,310,'https://picsum.photos/seed/dogs/1200/630',$11::vector),
    ($12,'first-gen-college-fund-maria',$13,NULL,'First-Gen College Fund for Maria','Maria is the first in her family to attend a four-year university. She earned a merit scholarship but still faces a funding gap for her sophomore year. She is studying computer science and has already secured two summer internships. Help her finish what she started.','Education',12000,6800,145,280,'https://picsum.photos/seed/college/1200/630',$14::vector),
    ($15,'wildfire-evacuation-pet-supplies',$16,$17,'Wildfire Evacuation Pet Supply Kits','During evacuations, families often have to leave pets behind because they lack supplies on hand. We are pre-positioning 500 emergency kits — food, leashes, crates, and medication pouches — at community centers in high-risk zones so no animal gets left behind.','Animals',8000,3900,112,195,'https://picsum.photos/seed/pets/1200/630',$18::vector),
    ($19,'neighborhood-air-quality-sensors',$20,NULL,'Open-Source Air Quality Sensors for Our Neighborhood','We are installing a block-by-block network of open-source particulate sensors to track wildfire smoke and industrial pollution in real time, sharing data publicly so residents can make informed decisions about outdoor activity.','Emergencies',10000,5200,134,221,'https://picsum.photos/seed/airsensor/1200/630',$21::vector)`,
    // Janahan (JN) organizes 3 fundraisers → his profile "Organizing since 2015 · 3 fundraisers"
    // + the profile fundraiser carousel populates (was empty: he organized none).
    [WF,SJ,WD,story,makeEmb('Emergencies',10), BR,SJ,makeEmb('Education',11),
     DR,JN,makeEmb('Animals',12), CO,AR,makeEmb('Education',13),
     PS,JN,WD,makeEmb('Animals',14), AQ,JN,makeEmb('Emergencies',15)]);

  await ins(`INSERT INTO fundraiser_update (id,fundraiser_id,author_id,body,created_at) VALUES
    ($1,$2,$3,'Thank you to everyone who donated in our first two weeks. We have ordered the sensor hardware for county one and onboarded our first two volunteer technicians. Installation begins next month.',$4),
    ($5,$6,$7,'Mid-campaign update: sensors are up and running in Placer County. We ran a successful test drill with 1,400 households. The response time from detection to alert was 78 seconds — beating our 90-second target.',$8),
    ($9,$10,$11,'Alert system now live in 3 counties. Over 6,200 households are now covered. We are expanding to two more counties next quarter and training a new cohort of overnight monitors. Your generosity made this real.',$12),
    ($13,$14,$15,'We have broken ground on the new band room. Framing is complete and we have sourced 12 replacement instruments from a music school closing in the district. Thank you.',$16)`,
    [U1,WF,SJ,da(45), U2,WF,SJ,da(22), U3,WF,SJ,da(3), UB,BR,SJ,da(10)]);

  // U3 is the most recent update — close_friend "missed" it
  await ins(`INSERT INTO update_summary (update_id,summary) VALUES ($1,'Alert system is now live in 3 counties, covering over 6,200 households.'),($2,'Sensors are live in Placer County with 78-second alert response time.'),($3,'Band room framing complete and 12 replacement instruments sourced.')`,
    [U3, U2, UB]);

  // Persona donations
  await ins(`INSERT INTO donation (id,fundraiser_id,donor_id,amount_usd,frequency,tip_amount_usd,created_at) VALUES
    ($1,$2,$3,50,'one_time',5,$4),($5,$6,$7,25,'one_time',NULL,$8),($9,$10,$11,30,'one_time',3,$12),($13,$14,$15,20,'one_time',NULL,$16),($17,$18,$19,40,'one_time',4,$20)`,
    [D01,WF,SK,da(7), D02,WF,SK,da(60), D03,DR,SK,da(30), D04,CO,SK,da(90), D05,PS,SK,da(150)]);
  await ins(`INSERT INTO donation (id,fundraiser_id,donor_id,amount_usd,frequency,tip_amount_usd,created_at) VALUES
    ($1,$2,$3,15,'one_time',NULL,$4),($5,$6,$7,20,'one_time',2,$8),($9,$10,$11,10,'one_time',NULL,$12),($13,$14,$15,25,'one_time',3,$16)`,
    [D06,DR,MT,da(30), D07,CO,MT,da(60), D08,PS,MT,da(120), D09,AQ,MT,da(180)]);
  await ins(`INSERT INTO donation (id,fundraiser_id,donor_id,amount_usd,frequency,tip_amount_usd,created_at) VALUES ($1,$2,$3,25,'one_time',NULL,$4)`,
    [D10,WF,PM,da(420)]);
  await ins(`INSERT INTO donation (id,fundraiser_id,donor_id,amount_usd,frequency,tip_amount_usd,created_at) VALUES
    ($1,$2,$3,35,'one_time',3,$4),($5,$6,$7,50,'one_time',5,$8),($9,$10,$11,20,'one_time',NULL,$12),($13,$14,$15,40,'one_time',4,$16),($17,$18,$19,25,'one_time',NULL,$20),($21,$22,$23,30,'one_time',3,$24)`,
    [D11,DR,JN,da(30), D12,CO,JN,da(60), D13,PS,JN,da(90), D14,AQ,JN,da(120), D15,DR,JN,da(180), D16,CO,JN,da(270)]);

  // Attribution donations (from share events)
  await ins(`INSERT INTO donation (id,fundraiser_id,donor_id,amount_usd,frequency,tip_amount_usd,created_at) VALUES
    ($1,$2,NULL,50,'one_time',5,$3),($4,$5,NULL,35,'one_time',NULL,$6),($7,$8,NULL,100,'one_time',10,$9),($10,$11,NULL,25,'one_time',NULL,$12),($13,$14,NULL,40,'one_time',4,$15)`,
    [DA1,WF,da(14), DA2,WF,da(12), DA3,WF,da(10), DA4,WF,da(9), DA5,WF,da(8)]);

  // ~40 filler donations spread over 12 months
  const fill: Array<[string,string,number,string,number|null,number]> = [
    ['00000000-0000-4000-8000-000000002030',WF,20,'one_time',null,5],
    ['00000000-0000-4000-8000-000000002031',WF,75,'one_time',7,8],
    ['00000000-0000-4000-8000-000000002032',WF,30,'monthly',3,15],
    ['00000000-0000-4000-8000-000000002033',WF,50,'one_time',null,20],
    ['00000000-0000-4000-8000-000000002034',WF,100,'one_time',10,25],
    ['00000000-0000-4000-8000-000000002035',WF,25,'one_time',null,35],
    ['00000000-0000-4000-8000-000000002036',WF,40,'one_time',4,50],
    ['00000000-0000-4000-8000-000000002037',WF,60,'monthly',6,70],
    ['00000000-0000-4000-8000-000000002038',WF,200,'one_time',20,100],
    ['00000000-0000-4000-8000-000000002039',WF,15,'one_time',null,130],
    ['00000000-0000-4000-8000-000000002040',WF,80,'one_time',8,180],
    ['00000000-0000-4000-8000-000000002041',WF,35,'one_time',null,240],
    ['00000000-0000-4000-8000-000000002042',WF,50,'one_time',5,300],
    ['00000000-0000-4000-8000-000000002043',BR,100,'one_time',10,5],
    ['00000000-0000-4000-8000-000000002044',BR,50,'one_time',null,12],
    ['00000000-0000-4000-8000-000000002045',BR,25,'one_time',null,20],
    ['00000000-0000-4000-8000-000000002046',BR,200,'one_time',15,30],
    ['00000000-0000-4000-8000-000000002047',BR,75,'one_time',null,45],
    ['00000000-0000-4000-8000-000000002048',BR,40,'monthly',4,60],
    ['00000000-0000-4000-8000-000000002049',BR,500,'one_time',25,90],
    ['00000000-0000-4000-8000-000000002050',DR,30,'one_time',null,7],
    ['00000000-0000-4000-8000-000000002051',DR,50,'one_time',5,25],
    ['00000000-0000-4000-8000-000000002052',DR,20,'one_time',null,60],
    ['00000000-0000-4000-8000-000000002053',DR,100,'one_time',null,120],
    ['00000000-0000-4000-8000-000000002054',CO,25,'one_time',null,10],
    ['00000000-0000-4000-8000-000000002055',CO,50,'one_time',5,40],
    ['00000000-0000-4000-8000-000000002056',CO,100,'one_time',null,90],
    ['00000000-0000-4000-8000-000000002057',PS,20,'one_time',null,15],
    ['00000000-0000-4000-8000-000000002058',PS,35,'one_time',3,50],
    ['00000000-0000-4000-8000-000000002059',PS,50,'one_time',null,100],
    ['00000000-0000-4000-8000-000000002060',AQ,40,'one_time',4,20],
    ['00000000-0000-4000-8000-000000002061',AQ,75,'one_time',null,60],
    ['00000000-0000-4000-8000-000000002062',AQ,30,'one_time',null,120],
    ['00000000-0000-4000-8000-000000002063',WF,500,'one_time',50,160],
    ['00000000-0000-4000-8000-000000002064',WF,150,'one_time',null,200],
    ['00000000-0000-4000-8000-000000002065',BR,150,'one_time',10,180],
    ['00000000-0000-4000-8000-000000002066',DR,45,'one_time',null,200],
    ['00000000-0000-4000-8000-000000002067',CO,80,'one_time',null,210],
    ['00000000-0000-4000-8000-000000002068',PS,60,'one_time',6,250],
    ['00000000-0000-4000-8000-000000002069',AQ,100,'one_time',null,300],
  ];
  for (const [id,fid,amt,freq,tip,ago] of fill)
    await ins(`INSERT INTO donation (id,fundraiser_id,donor_id,amount_usd,frequency,tip_amount_usd,created_at) VALUES ($1,$2,NULL,$3,$4,$5,$6)`,
      [id,fid,amt,freq,tip,da(ago)]);

  // Follows
  const fol: Array<[string,string,string,number]> = [
    [SK,'fundraiser',WF,180],[SK,'fundraiser',DR,150],[SK,'fundraiser',CO,120],
    [SK,'fundraiser',PS,90],[SK,'fundraiser',AQ,60],[SK,'profile',SJ,200],
    [MT,'fundraiser',DR,200],[MT,'fundraiser',CO,180],[MT,'fundraiser',PS,150],
    [MT,'fundraiser',AQ,120],[MT,'profile',DO,250],[MT,'profile',LP,220],
    [MT,'profile',JW,190],[MT,'profile',AR,180],[MT,'profile',JN,160],
    [MT,'community',WD,300],[MT,'community',NC,280],
    [PM,'profile',SJ,420],
    [JN,'fundraiser',WF,100],[JN,'fundraiser',DR,90],[JN,'fundraiser',CO,80],
    [JN,'fundraiser',PS,70],[JN,'fundraiser',AQ,60],[JN,'profile',SK,200],
    [JN,'profile',MT,180],[JN,'profile',DO,150],[JN,'profile',LP,130],
  ];
  for (const [fid,tt,tid,ago] of fol)
    await ins(`INSERT INTO follow (follower_id,target_type,target_id,created_at) VALUES ($1,$2,$3,$4)`,
      [fid,tt,tid,da(ago)]);

  await ins(`INSERT INTO community_membership (community_id,member_id,role,joined_at) VALUES
    ($1,$2,'organizer',$3),($4,$5,'follower',$6),($7,$8,'follower',$9),($10,$11,'organizer',$12),($13,$14,'follower',$15),($16,$17,'follower',$18)`,
    [WD,SJ,da(500), WD,MT,da(300), WD,LP,da(200), NC,SJ,da(400), NC,MT,da(280), NC,DO,da(150)]);

  await ins(`INSERT INTO community_activity (id,community_id,actor_id,verb,body,created_at,reaction_count,comment_count) VALUES
    ($1,$2,$3,'milestone','Watch Duty reached 1,000 followers — thank you for standing with us.',$4,14,3),
    ($5,$6,$7,'donated','A supporter just contributed to the wildfire alert network.',$8,8,1),
    ($9,$10,$11,'started','New fundraiser: emergency pet supply kits for evacuation zones.',$12,12,2),
    ($13,$14,$15,'donated','A neighbor helped the community alert fund reach a new milestone.',$16,6,0),
    ($17,$18,$19,'milestone','Alert system coverage expanded to a second county.',$20,22,4),
    ($21,$22,$23,'donated','Another supporter joined the effort to keep alerts running this winter.',$24,5,1),
    ($25,$26,$27,'started','Watch Duty launched a neighborhood air quality monitoring initiative.',$28,10,2),
    ($29,$30,$31,'milestone','Watch Duty fundraisers have collectively raised over $1.4 million.',$32,31,5)`,
    [A1,WD,SJ,da(2), A2,WD,MT,da(4), A3,WD,LP,da(7), A4,WD,DO,da(10),
     A5,WD,SJ,da(15), A6,WD,JW,da(20), A7,WD,JW,da(28), A8,WD,SJ,da(35)]);

  await ins(`INSERT INTO reaction (target_type,target_id,member_id,kind,created_at) VALUES
    ('activity',$1,$2,'heart',$3),('activity',$4,$5,'heart',$6),('activity',$7,$8,'heart',$9),('activity',$10,$11,'heart',$12)`,
    [A1,MT,da(2), A1,LP,da(2), A5,MT,da(14), A5,DO,da(14)]);

  await ins(`INSERT INTO comment (id,target_type,target_id,author_id,body,created_at) VALUES
    (gen_random_uuid(),'update',$1,$2,'This is incredible news. So proud of everyone who contributed!',$3),
    (gen_random_uuid(),'activity',$4,$5,'Wonderful milestone. Keep it up!',$6),
    (gen_random_uuid(),'activity',$7,$8,'Happy to be part of this community.',$9)`,
    [U3,MT,da(3), A1,LP,da(2), A5,DO,da(15)]);

  await ins(`INSERT INTO share_event (share_id,sharer_token,entity_type,entity_id,channel,created_at) VALUES
    ($1,'mike_t','fundraiser',$2,'facebook',$3),($4,'mike_t','fundraiser',$5,'whatsapp',$6),
    ($7,'mike_t','fundraiser',$8,'x',$9),($10,'sarah_k','fundraiser',$11,'email',$12),
    ($13,'sarah_k','fundraiser',$14,'copy_link',$15),($16,'mike_t','fundraiser',$17,'messenger',$18),
    ($19,'lena_p','fundraiser',$20,'sms',$21),($22,'mike_t','fundraiser',$23,'copy_link',$24)`,
    [SH1,WF,da(20), SH2,WF,da(18), SH3,WF,da(15), SH4,WF,da(12),
     SH5,WF,da(10), SH6,WF,da(9), SH7,WF,da(8), SH8,WF,da(5)]);

  // DA1-3 → mike_t whatsapp share; DA4-5 → sarah_k email share
  await ins(`INSERT INTO donation_attribution (donation_id,share_id,sharer_token) VALUES
    ($1,$2,'mike_t'),($3,$4,'mike_t'),($5,$6,'mike_t'),($7,$8,'sarah_k'),($9,$10,'sarah_k')`,
    [DA1,SH2, DA2,SH2, DA3,SH2, DA4,SH4, DA5,SH4]);

  // Sun marks: wildfire board, watch-duty, janahan profile. Band-room has ZERO marks.
  // mike_t inherited = 50% of $185 attributed (DA1+DA2+DA3 via mike_t shares) = $92
  // CB-05: S7 carries display_name='Mike T.' so visiting with utm_share_user=mike_t shows
  //         "Mike T. shared this" and the extrovert persona sees "Your sun".
  const mkT = {own:0,inh:92}; const mkTsz = sz(mkT.own,mkT.inh);
  const marks: Array<[string,string,string,string,string|null,string,string,number,number,number,number]> = [
    [S1,'fundraiser',WF,'priya_m',null,'follow','grey',0,0,sz(0,0),400],
    [S2,'fundraiser',WF,'sarah_k','Sarah K.','follow,share','gold',0,0,sz(0,0),200],
    [S3,'fundraiser',WF,'james_w',null,'follow,share','teal',0,0,sz(0,0),180],
    [S4,'fundraiser',WF,'david_o',null,'follow,share','violet',0,0,sz(0,0),160],
    [S5,'fundraiser',WF,'janahan_s',null,'follow,give','brand',40,0,sz(40,0),120],
    [S6,'fundraiser',WF,'aisha_r',null,'follow,share,give','gold',35,0,sz(35,0),90],
    // CB-05: mike_t has display_name='Mike T.' (consent given); named sun on wildfire board.
    // gradient_id='teal' is a curated key-gradient. size_score is sublinear(own+inherited).
    // UNIQUE(entity_type,entity_id,owner_token) is respected — this is the sole mike_t mark on WF.
    [S7,'fundraiser',WF,'mike_t','Mike T.','follow,share','teal',mkT.own,mkT.inh,mkTsz,18],
    [S8,'community',WD,'mike_t',null,'follow,share,give','brand',25,0,sz(25,0),300],
    [S9,'community',WD,'lena_p',null,'follow','grey',0,0,sz(0,0),200],
    [S10,'profile',JN,'mike_t',null,'follow,share','violet',0,0,sz(0,0),160],
  ];
  for (const [id,et,eid,tok,dn,mask,grad,own,inh,score,ago] of marks)
    await ins(`INSERT INTO sun_mark (id,entity_type,entity_id,owner_token,display_name,action_mask,gradient_id,own_amount_usd,inherited_usd,size_score,visible,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,$11)`,
      [id,et,eid,tok,dn,mask,grad,own,inh,score,da(ago)]);

  // CB-24: bulk deterministic sun_mark rows so getSupporterCount returns ≈847 (WF) and ≈1240 (WD).
  // Named/existing marks account for 7 on WF (S1-S7) and 2 on WD (S8-S9), so we generate:
  //   840 additional for WF → total 847
  //   1238 additional for WD → total 1240
  // Deterministic: owner_token = 'mark-wf-NNNN' / 'mark-wd-NNNN', UUID from counter.
  // action_mask cycles through mixes; gradient_id follows action_mask (grey=follow-only).
  // own_amount_usd / inherited_usd small spreads; size_score via sz(); created_at spread over 365d.
  const bulkMasks   = ['follow','follow,share','follow,give','follow,share,give'];
  const bulkGrads   = ['grey',  'teal',        'brand',      'gold'];
  const bulkOwnAmt  = [0, 0, 15, 25];     // follow/share/give/all
  const bulkInhAmt  = [0, 0, 0,  5];

  // Deterministic valid-format UUID: namespace aa=WF bulk, bb=WD bulk. 8-4-4-4-12 hex groups.
  const bulkUUID = (prefix: 'wf' | 'wd', n: number): string => {
    const pfx = prefix === 'wf' ? 'aa' : 'bb';
    const seq = n.toString(16).padStart(12, '0');
    return `00000000-0000-4000-${pfx}00-${seq}`;
  };

  // Generate WF bulk marks (840 additional, tokens mark-wf-0001…mark-wf-0840)
  const WF_BULK = 840;
  const wfBatch: string[] = [];
  const wfParams: unknown[] = [];
  let pidx = 1;
  for (let n = 1; n <= WF_BULK; n++) {
    const mi   = (n - 1) % 4;
    const own  = bulkOwnAmt[mi];
    const inh  = bulkInhAmt[mi];
    const score = sz(own, inh);
    const ago  = ((n - 1) % 365) + 1;   // 1..365 days ago, deterministic cycling
    const tok  = `mark-wf-${n.toString().padStart(4,'0')}`;
    const uid  = bulkUUID('wf', n);
    wfBatch.push(`($${pidx},'fundraiser',$${pidx+1},$${pidx+2},NULL,$${pidx+3},$${pidx+4},$${pidx+5},$${pidx+6},$${pidx+7},true,$${pidx+8})`);
    wfParams.push(uid, WF, tok, bulkMasks[mi], bulkGrads[mi], own, inh, score, da(ago));
    pidx += 9;
    // Flush in batches of 100 to keep param list manageable
    if (wfBatch.length === 100) {
      await ins(`INSERT INTO sun_mark (id,entity_type,entity_id,owner_token,display_name,action_mask,gradient_id,own_amount_usd,inherited_usd,size_score,visible,created_at) VALUES ${wfBatch.join(',')}`, wfParams);
      wfBatch.length = 0; wfParams.length = 0; pidx = 1;
    }
  }
  if (wfBatch.length > 0) {
    await ins(`INSERT INTO sun_mark (id,entity_type,entity_id,owner_token,display_name,action_mask,gradient_id,own_amount_usd,inherited_usd,size_score,visible,created_at) VALUES ${wfBatch.join(',')}`, wfParams);
  }

  // Generate WD bulk marks (1238 additional, tokens mark-wd-0001…mark-wd-1238)
  const WD_BULK = 1238;
  const wdBatch: string[] = [];
  const wdParams: unknown[] = [];
  pidx = 1;
  for (let n = 1; n <= WD_BULK; n++) {
    const mi   = (n - 1) % 4;
    const own  = bulkOwnAmt[mi];
    const inh  = bulkInhAmt[mi];
    const score = sz(own, inh);
    const ago  = ((n - 1) % 365) + 1;
    const tok  = `mark-wd-${n.toString().padStart(4,'0')}`;
    const uid  = bulkUUID('wd', n);
    wdBatch.push(`($${pidx},'community',$${pidx+1},$${pidx+2},NULL,$${pidx+3},$${pidx+4},$${pidx+5},$${pidx+6},$${pidx+7},true,$${pidx+8})`);
    wdParams.push(uid, WD, tok, bulkMasks[mi], bulkGrads[mi], own, inh, score, da(ago));
    pidx += 9;
    if (wdBatch.length === 100) {
      await ins(`INSERT INTO sun_mark (id,entity_type,entity_id,owner_token,display_name,action_mask,gradient_id,own_amount_usd,inherited_usd,size_score,visible,created_at) VALUES ${wdBatch.join(',')}`, wdParams);
      wdBatch.length = 0; wdParams.length = 0; pidx = 1;
    }
  }
  if (wdBatch.length > 0) {
    await ins(`INSERT INTO sun_mark (id,entity_type,entity_id,owner_token,display_name,action_mask,gradient_id,own_amount_usd,inherited_usd,size_score,visible,created_at) VALUES ${wdBatch.join(',')}`, wdParams);
  }

  // Share copy: 7 channels × 3 entities = 21 rows
  const cp: Array<[string,string,string,string]> = [
    ['fundraiser',WF,'facebook','Families in wildfire-prone counties need real-time alerts. This crew built a 90-second detection system and they are expanding it. Help them reach three more counties before fire season peaks.'],
    ['fundraiser',WF,'x','Wildfire alerts that actually work — 90 seconds from detection to your phone. Help expand to three more counties this season.'],
    ['fundraiser',WF,'whatsapp','Hey — this wildfire alert project is the real deal. They have already helped 6,200 households. Sharing in case anyone you know is in a fire zone.'],
    ['fundraiser',WF,'messenger','Thought you would want to know about this. A community-run wildfire alert network — already live in 3 counties. They are trying to expand further before peak season.'],
    ['fundraiser',WF,'sms','Check this out: community wildfire alerts that go out in 90 seconds. Expanding to 3 more counties. Worth a read.'],
    ['fundraiser',WF,'email','I wanted to share a fundraiser that I think matters. A team of volunteers built a real-time wildfire alert system — it is already protecting over 6,200 households. They are raising funds to expand. I hope you will consider supporting them.'],
    ['fundraiser',WF,'copy_link','Real-time wildfire safety alerts — community-built system now covering 3 counties and expanding.'],
    ['community',WD,'facebook','Watch Duty is a volunteer network doing the hard work of keeping communities safe from wildfire. Over $1.4M raised, 12 active fundraisers. Follow along and support if you can.'],
    ['community',WD,'x','The Watch Duty community proves that neighbors can protect neighbors. Real alerts, real fundraisers, real impact.'],
    ['community',WD,'whatsapp','Sharing the Watch Duty community page — lots of good work happening here for wildfire safety in Northern California.'],
    ['community',WD,'messenger','This community is doing great work on wildfire preparedness. Check out Watch Duty.'],
    ['community',WD,'sms','Watch Duty — a community group raising funds for wildfire safety. Worth knowing about.'],
    ['community',WD,'email','I wanted to introduce you to the Watch Duty community. They have been coordinating wildfire safety efforts across Northern California, with over $1.4M raised through fundraisers. It is one of the most effective local efforts I have seen.'],
    ['community',WD,'copy_link','Watch Duty — wildfire preparedness community, NorCal. 12 active fundraisers, $1.4M raised.'],
    ['profile',JN,'facebook','Janahan has been supporting causes in education, community safety, and animal welfare for almost a decade. Check out the fundraisers he follows and supports.'],
    ['profile',JN,'x','Janahan S. — community supporter and consistent donor across causes that matter. Follow to see what he is backing.'],
    ['profile',JN,'whatsapp','Sharing Janahan\'s profile — he finds the best fundraisers before they go viral. Worth following.'],
    ['profile',JN,'messenger','Check out Janahan\'s fundraiser activity. He has been consistently supporting good causes for years.'],
    ['profile',JN,'sms','Janahan S. is someone worth following. Consistent supporter of community, education, and animal causes.'],
    ['profile',JN,'email','I wanted to introduce you to Janahan\'s profile. He has been a consistent supporter of education, community safety, and animal welfare fundraisers. His activity is worth following.'],
    ['profile',JN,'copy_link','Janahan S. — community supporter, education, animals, emergency relief.'],
  ];
  for (const [et,eid,ch,copy] of cp)
    await ins(`INSERT INTO share_copy (entity_type,entity_id,channel,copy) VALUES ($1,$2,$3,$4)`, [et,eid,ch,copy]);

  const tables = ['community','profile','fundraiser','donation','fundraiser_update',
    'update_summary','share_copy','community_membership','community_activity',
    'follow','comment','reaction','share_event','donation_attribution','sun_mark'];
  console.log('\n[db:seed] row counts:');
  for (const t of tables) {
    const { rows } = await query(`SELECT COUNT(*) AS n FROM ${t}`);
    console.log(`  ${t.padEnd(26)} ${rows[0].n}`);
  }
  console.log('\n[db:seed] done.');
}

async function main(): Promise<void> {
  await seedDatabase();
  await closePool();
}

// Run as CLI: `npx tsx db/seed.ts`
// Works under both tsx (process.argv[1] === __filename) and plain node.
const isCli =
  typeof require !== 'undefined'
    ? require.main === module
    : process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js');

if (isCli) {
  main().catch(e => { console.error('[db:seed] failed:', e); process.exit(1); });
}
