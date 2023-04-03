// function toHex(byte) {
//     return ('0' + byte.toString(16)).slice(-2);
// }

// function fromHex(hexString) {
//     return parseInt(hexString, 16);
// }

// function bytesToHexStr(bytes) {
//     return bytes.map(toHex).join('');
// }

// function hexStrToBytes(hexStr) {
//     return bytes.map(toHex).join('');
//}

function xorBytesWithKey(bytes, keyBytes) {
    // xor each bytes with a repeating window of length keyBytes
    return bytes.map((byte, i) => byte ^ keyBytes[i % keyBytes.length]);
}

function bytesToBase64(bytes) {
    const chars = [];
    for (let i = 0; i < bytes.length; i++) {
        chars.push(String.fromCharCode(bytes[i]));
    }
    return btoa(chars.join(''));
}

function base64ToBytes(base64Str) {
    const asciiStr = atob(base64Str);
    const bytes = [];
    for (let i = 0; i < asciiStr.length; i++) {
        bytes.push(asciiStr.charCodeAt(i));
    }
    return bytes;
}

function stringToBytes(string) {
    const encoder = new TextEncoder();
    return Array.from(encoder.encode(string));
}

function bytesToString(byteArr) {
    const decoder = new TextDecoder();
    return decoder.decode(new Uint8Array(byteArr));
}

function encrypt(strToEncrypt, key) {
    const dataBytes = stringToBytes(strToEncrypt);
    const keyBytes = stringToBytes(key);
    const encryptedBytes = xorBytesWithKey(dataBytes, keyBytes);
    return bytesToBase64(encryptedBytes);
}

function decrypt(strToDecrypt, key) {
    const encryptedBytes = base64ToBytes(strToDecrypt);
    const keyBytes = stringToBytes(key);
    const dataBytes = xorBytesWithKey(encryptedBytes, keyBytes);
    return dataBytes;
}

function hash(str) {
    let hash = 0;
    const strBytes = stringToBytes(str);
    for (let i = 0; i < strBytes.length; i++) {
        hash = (hash << 5) - hash + strBytes[i];
        hash |= 0; // Convert to 32-bit integer
    }
    hash ^= 1249284; // Just to mess some bits around
    return hash;
}

function passcodeHash(passcode) {
    let hashVal = hash(passcode);
    const hashBytes = [];
    for (let i = 0; i < 4; i++) {
        hashBytes.push(hashVal & 255);
        hashVal >>= 8;
    }
    const b64Str = bytesToBase64(hashBytes); // Will always be a 8-character string that ends with "=="
    return b64Str.substring(0, 6);
}

function encodeSecretString(passcode, puzzleData) {
    passcode = passcode.toLowerCase();
    return passcodeHash(passcode) + encrypt(JSON.stringify(puzzleData), passcode);
}

function decodeSecretString(passcode, secretString) {
    passcode = passcode.toLowerCase();
    const hash = passcodeHash(passcode);
    if (hash !== secretString.substring(0, 6)) {
        // Invalid passcode
        return undefined;
    }
    const dataBytes = decrypt(secretString.substring(6), passcode);
    return JSON.parse(bytesToString(dataBytes));
}

module.exports = {
    encodeSecretString,
    decodeSecretString,
};