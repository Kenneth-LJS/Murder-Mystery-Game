# Murder Mystery Game

The murder mystery game for Little Island Furcon Online (LIFCO) Autumn 2022. Players solve puzzles on the LIFC social media platforms and websites to get a 6-letter code, which is then entered into this game to unlock story chapters. Story chapters give hints to solving the murder mystery and finding the culprit.


## Setup

1. Install node packages: `npm ci`
2. Development mode: `npm run start`
3. Build (with dev files): `npm run build:dev`
   - Outputs to `dist` folder
4. Build (with prod files): `npm run build:prod`
   - Outputs to `dist` folder

## Playing the Game

On the game screen, you can enter a 6-letter code to access each chapter. The codes are listed below.

- Chapter 1: LISTEN
- Chapter 2: MINION
- Chapter 3: SILENT
- Chapter 4: SENSES
- Chapter 5: SWORDS
- Chapter 6: COBWEB
- Chapter 7: FACADE
- Chapter 8: NOVELS
- Chapter 9: TREPID
- Chapter 10: WHIMSY
- Chapter 11: ESCAPE
- Chapter 12: JACKAL
- Chapter 13: VOODOO
- Chapter 14: NUANCE
- Chapter 15: SAFARI
- Chapter 16: FINALE

## Developing

When in development mode or building the dev build, the engine uses assets in the `src/puzzle/data.dev` and `src/puzzle/assets.dev` folders.

When building the prod build, the engine uses assets in the `src/puzzle/data.prod` and `src/puzzle/assets.prod` folders.

We’ll refer to these as the `data` and `assets` folder respectively. All chapter data is stored in `*.puzzle.json` files in the `data` folder. If multiple files are found, they will be combined into one. Static assets are stored in the `assets` folder.

For the structure of the `*.puzzle.json` files, refer to [the docs](./docs.md).