export type CatAbilityId =
  | 'ember_dash'
  | 'shadow_step'
  | 'ghost_phase'
  | 'storm_pulse';

export type CatAbility = {
  id: CatAbilityId;
  name: string;
  summary: string;
};

export type CatDefinition = {
  name: string;
  body: string;
  dark: string;
  ear: string;
  eye: string;
  pupil: string;
  desc: string;
  backstory: string;
  ability: CatAbility;
};

export const CATS: CatDefinition[] = [
  {
    name: 'Ember',
    body: '#e8863a',
    dark: '#b8642a',
    ear: '#d47030',
    eye: '#2d1b0e',
    pupil: '#111',
    desc: 'Bold & fiery',
    backstory:
      'Ember was born beside the old furnace shrine, where dungeon cats once guarded the first flame. She charges into danger before fear can put on its boots.',
    ability: {
      id: 'ember_dash',
      name: 'Cinder Dash',
      summary: 'A quick burst forward that can outrun spreading darkness.',
    },
  },
  {
    name: 'Shadow',
    body: '#2a2a36',
    dark: '#1a1a24',
    ear: '#222230',
    eye: '#c8a832',
    pupil: '#886618',
    desc: 'Silent & swift',
    backstory:
      'Shadow learned the dungeon by listening to stone breathe. No one sees him enter a room, but the torches always lean toward where he has been.',
    ability: {
      id: 'shadow_step',
      name: 'Nightstep',
      summary: 'A silent blink between nearby safe tiles.',
    },
  },
  {
    name: 'Ghost',
    body: '#e8e4e0',
    dark: '#c4beb8',
    ear: '#d4cec8',
    eye: '#5588cc',
    pupil: '#335588',
    desc: 'Pale & mystic',
    backstory:
      'Ghost was found asleep in a sealed crypt with dust on her whiskers and moonlight in her eyes. Walls remember her, but rarely stop her.',
    ability: {
      id: 'ghost_phase',
      name: 'Veilwalk',
      summary: 'A brief phase that can slip through one wall.',
    },
  },
  {
    name: 'Storm',
    body: '#7a7a8a',
    dark: '#5a5a6a',
    ear: '#686878',
    eye: '#66cc66',
    pupil: '#338833',
    desc: 'Calm & fierce',
    backstory:
      'Storm padded down from the bell tower after lightning split the roof. She moves with calm paws, but thunder keeps her secrets.',
    ability: {
      id: 'storm_pulse',
      name: 'Thunder Pulse',
      summary: 'A charged pulse that pushes darkness back for a moment.',
    },
  },
];