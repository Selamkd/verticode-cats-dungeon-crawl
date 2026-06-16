export type CatDefinition = {
  name: string;
  body: string;
  dark: string;
  ear: string;
  eye: string;
  pupil: string;
  desc: string;
};

export const CATS: CatDefinition[] = [
  {
    name: 'Yuki',
    body: '#e8863a',
    dark: '#b8642a',
    ear: '#d47030',
    eye: '#2d1b0e',
    pupil: '#111',
    desc: 'Bold & fiery',
  },
  {
    name: 'Nova',
    body: '#2a2a36',
    dark: '#1a1a24',
    ear: '#222230',
    eye: '#c8a832',
    pupil: '#886618',
    desc: 'Silent & swift',
  },
  {
    name: 'Merin',
    body: '#e8e4e0',
    dark: '#c4beb8',
    ear: '#d4cec8',
    eye: '#5588cc',
    pupil: '#335588',
    desc: 'Pale & mystic',
  },
  {
    name: 'Kuro',
    body: '#7a7a8a',
    dark: '#5a5a6a',
    ear: '#686878',
    eye: '#66cc66',
    pupil: '#338833',
    desc: 'Calm & fierce',
  },
];