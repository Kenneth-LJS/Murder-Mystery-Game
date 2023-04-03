const path = require('path');
const tsImport = require('ts-import');

// const { encodeSecretString } = require('../puzzle-crypto/index.js');
const { encodeSecretString } = tsImport.loadSync(path.join(__dirname, '../puzzle-crypto/index.ts'));

function puzzleJsonLoader(source) {
    const puzzleJson = JSON.parse(source);
    const transformedPuzzleJson = transformPuzzleJson(puzzleJson);
    const transformedSource = JSON.stringify(transformedPuzzleJson);
    return transformedSource;
}

function transformPuzzleJson(puzzleJson) {
    return Object.keys(puzzleJson).map((passcode) => {
        const puzzleData = puzzleJson[passcode];
        return encodeSecretString(passcode, puzzleData);
    });
}

module.exports = puzzleJsonLoader;
