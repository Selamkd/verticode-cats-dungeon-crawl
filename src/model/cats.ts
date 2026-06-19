export type CatAbilityId =
  | 'box_breach'
  | 'shadow_cloak'
  | 'wrong_fuse_theory'
  | 'twin_engine'
  | 'time_freeze'
  | 'sweater_glow'
  | 'dittoo'
  | 'bestie_merge';

export type CatAbility = {
  id: CatAbilityId;
  name: string;
  summary: string;
};

export type CatDefinition = {
  name: string;
  spriteKey: string;
  body: string;
  dark: string;
  ear: string;
  eye: string;
  pupil: string;
  desc: string;
  backstory: string;
  ability: CatAbility;
};

function shuffleCats(cats: CatDefinition[]) {
  const shuffled = [...cats];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export const CATS: CatDefinition[] = shuffleCats([
  {
    name: 'Yuki',
    spriteKey: 'cat_0_yuki',
    body: '#f1efe7',
    dark: '#c9c4b8',
    ear: '#e6d8d2',
    eye: '#6f8fb8',
    pupil: '#243247',
    desc: 'Box-powered escape artist',
    backstory:
      'Yuki brought his box into the dungeon because of course he did. The box is now classified as equipment, shelter, vehicle, and emotional support architecture.',
    ability: {
      id: 'box_breach',
      name: 'Box Breach',
      summary:
        'Yuki climbs into his box and rockets across a room in one cardboard-powered burst, then waits for the box to cool down before using it again.',
    },
  },
{
  name: 'Kika',
  spriteKey: 'cat_1_kika',
  body: '#1b1514',
  dark: '#080707',
  ear: '#2a1b1a',
  eye: '#d8e6a6',
  pupil: '#111111',
  desc: 'Tiny void, cursed couture',
  backstory:
    'Kika did not choose the sweater. The sweater chose Kika, and Kika has been silently plotting against it ever since. Unfortunately, her rage makes it glow.',
  ability: {
    id: 'sweater_glow',
    name: 'Spite Knit Halo',
    summary:
      'Kika’s unwanted sweater radiates pure offended energy, illuminating the 8 tiles around her while she judges the dungeon, the player, and the concept of clothing.',
  },
},
{
  name: 'Tim',
  spriteKey: 'cat_2_tim',
  body: '#d19a52',
  dark: '#8f5f2c',
  ear: '#b9783c',
  eye: '#d7c16a',
  pupil: '#2b1a0c',
  desc: 'Totally real. Why would you even ask.',
  backstory:
    'Tim entered the dungeon with perfect posture, a seasonal disguise, and the quiet confidence of an object pretending to be a cat. No one has proved he is not real, which is legally enough.',
  ability: {
    id: 'dittoo',
    name: 'Totally Tim',
    summary:
      'Tim becomes any other cat for a brief stretch, borrowing their ability while his suspiciously motionless decoy absorbs the dungeon’s attention.',
  },
},
  {
    name: 'Rizz & Figgy',
    spriteKey: 'cat_3_rizz_figgy',
    body: '#d28a5c',
    dark: '#8f5338',
    ear: '#bf7054',
    eye: '#7ed0a5',
    pupil: '#24533f',
    desc: 'Twin engine',
    backstory:
      'Rizz and Figgy entered as a pair because separating them would be rude, unsafe, and probably impossible. The dungeon now has twice the pawprints and twice the problem.',
    ability: {
      id: 'twin_engine',
      name: 'Twin Engine',
      summary:
        'Rizz and Figgy fuel each other with double speed and double light, but every time penalty hits twice as hard.',
    },
  },
  {
    name: 'June & Joe',
    spriteKey: 'cat_4_june_joe',
    body: '#8d8b78',
    dark: '#5f5d50',
    ear: '#7b725f',
    eye: '#d9c86a',
    pupil: '#5a4d18',
    desc: 'Best friends, merged rules',
    backstory:
      'June and Joe chose teamwork and the dungeon is shaking in fear. June brings the glow, Joe brings the shadow, and together they make the map slightly nervous.',
    ability: {
      id: 'bestie_merge',
      name: 'Bestie Merge',
      summary:
        'June increases the light around them while Joe’s shadow lets them slip through tiles that should have said no.',
    },
  },
  {
    name: 'Merlin',
    spriteKey: 'cat_5_merin',
    body: '#4c4b5f',
    dark: '#2d2b3d',
    ear: '#3b364d',
    eye: '#c59cff',
    pupil: '#4b2672',
    desc: 'Rule breaking, fuse-setting mischief',
    backstory:
      'Merlin never followed rules before the dungeon, and he is not starting now. The fuses are confused, the walls are concerned, and Merlin is very pleased.',
    ability: {
      id: 'wrong_fuse_theory',
      name: 'Wrong Fuse Theory',
      summary:
        'Every incorrect fuse Merlin sets off counts as correct, and every correct fuse counts as wrong, but arguing with reality costs 30 seconds.',
    },
  },
  {
    name: 'Teddy',
    spriteKey: 'cat_6_teddy',
    body: '#b98a62',
    dark: '#74513d',
    ear: '#a16f55',
    eye: '#84c7ff',
    pupil: '#244f7a',
    desc: 'Cheeky little cheater',
    backstory:
      'Teddy found a loophole in the dungeon before the dungeon finished explaining itself. Nobody knows how. Teddy refuses to answer without snacks.',
    ability: {
      id: 'time_freeze',
      name: 'Cheater’s Head Start',
      summary:
        'Teddy freezes time for the first 30 seconds, stopping the darkness before it gets a chance to make things dramatic.',
    },
  },
]);