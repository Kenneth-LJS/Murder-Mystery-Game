import { decodeSecretString } from '../puzzle-crypto/index';

import {
    Flag,
    LocalData,
    NodeDataClickImageInput,
    NodeDataOptionInput,
    NodeDataTextInput,
    NodeState,
    Puzzle,
    PuzzleState,
    TextInputResponseAction,
    UserResponse,
} from './types/puzzle';
import { getNowMs } from './utils/time';

const puzzleData = (() => {
    // Loads all the puzzles in ./puzzle-data
    // These must be named in the form of: [filename].puzzle.json
    // If [filename] starts with an underscore, the file is ignored

    // console.log('process.env.PUZZLE_MODE', process.env.PUZZLE_MODE);

    const requireContext =
        process.env.PUZZLE_MODE === 'development'
            ? require.context('./puzzle/data.dev', true)
            : require.context('./puzzle/data.prod', true);
    return requireContext
        .keys()
        .map((filename) => {
            if (filename.replace(/^\.\//, '').startsWith('_')) {
                return [];
            }
            return requireContext(filename) as string[];
        })
        .reduce(
            (allPuzzleStrings, newPuzzleStrings) => [
                ...allPuzzleStrings,
                ...newPuzzleStrings,
            ],
            []
        );
})();

export function getPuzzleFromCode(passcode: string) {
    for (let i = 0; i < puzzleData.length; i++) {
        const secretString = puzzleData[i];
        const data = decodeSecretString(passcode, secretString);
        if (typeof data !== 'undefined') {
            return data;
        }
    }
    return undefined;
}

export const getPuzzleAsset = (() => {
    const requireContext =
        process.env.PUZZLE_MODE === 'development'
            ? require.context('./puzzle/assets.dev', true)
            : require.context('./puzzle/assets.prod', true);
    const imageAssets: { [key: string]: string } = {};
    requireContext.keys().forEach((filename) => {
        const assetKey = filename.replace(/^\.\//, '');
        const assetPath = requireContext(filename);

        imageAssets[assetKey] = assetPath;
    });

    function getPuzzleAsset(filename: string) {
        return imageAssets[filename];
    }

    return getPuzzleAsset;
})();

export const getImagePixel = (() => {
    const pixelGetters: {
        [filename: string]: (x: number, y: number) => string;
    } = {};

    async function loadPixelGetter(filename: string) {
        const img = await new Promise<HTMLImageElement>((resolve) => {
            const img = new Image();
            img.src = getPuzzleAsset(filename);
            img.addEventListener(
                'load',
                () => {
                    resolve(img);
                },
                { once: true }
            );
        });
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const context = canvas.getContext('2d');
        context.drawImage(img, 0, 0);

        function getPixel(x: number, y: number) {
            const data = context.getImageData(x, y, 1, 1).data;
            const r = data[0];
            const g = data[1];
            const b = data[2];
            return (
                '#' +
                [r, g, b].map((v) => ('00' + v.toString(16)).slice(-2)).join('')
            );
        }

        return getPixel;
    }

    async function getImagePixel(filename: string, x: number, y: number) {
        if (!pixelGetters.hasOwnProperty(filename)) {
            pixelGetters[filename] = await loadPixelGetter(filename);
        }
        return pixelGetters[filename](x, y);
    }

    return getImagePixel;
})();

export function processPuzzleHtml(puzzleHtml: string) {
    // Cache this function if it runs slow

    const puzzleDom = new DOMParser().parseFromString(puzzleHtml, 'text/html');
    Array.from(puzzleDom.getElementsByTagName('img')).forEach((imgElem) => {
        const oldSrc = imgElem.getAttribute('src');
        const newSrc = getPuzzleAsset(oldSrc) || oldSrc;
        imgElem.setAttribute('src', newSrc);
    });
    Array.from(puzzleDom.getElementsByTagName('video')).forEach((videoElem) => {
        const oldSrc = videoElem.getAttribute('src');
        const newSrc = getPuzzleAsset(oldSrc) || oldSrc;
        videoElem.setAttribute('src', newSrc);
    });
    return puzzleDom.querySelector('body').innerHTML;
}

function initDefaultLocalData(): LocalData {
    return {
        flags: {},
    };
}

export function initializePuzzleState(puzzle: Puzzle): PuzzleState {
    const startNodeId = puzzle.startNode;
    const uidGenerator = initUidGenerator(0);
    const nodeStates = stepThroughPuzzleStates(
        puzzle,
        startNodeId,
        initDefaultLocalData(),
        uidGenerator
    );
    return {
        _nextStateUid: uidGenerator(),
        nodeStates: nodeStates,
    };
}

export async function processPuzzleState(
    puzzle: Puzzle,
    puzzleState: PuzzleState,
    userResponse: UserResponse
): Promise<PuzzleState> {
    const uidGenerator = initUidGenerator(puzzleState._nextStateUid);
    const nodeIndex = userResponse.nodeIndex;
    const nodeId = puzzleState.nodeStates[nodeIndex].nodeId;
    const node = puzzle.nodes[nodeId];
    let nodeStates = puzzleState.nodeStates.slice(0, nodeIndex + 1);

    let nextNodeId: string = undefined;
    let nextLocalData = nodeStates[nodeStates.length - 1].localData;
    if (userResponse.type === 'text' && node.type === 'text-input') {
        if (userResponse.isEnter) {
            let action: TextInputResponseAction = undefined;
            for (const nodeResponse of node.responses) {
                const check = nodeResponse.check;
                if (check.type === 'string') {
                    if (
                        !check.isCaseSensitive &&
                        check.string.toLowerCase() ===
                            userResponse.value.toLowerCase()
                    ) {
                        action = nodeResponse.action;
                        break;
                    } else if (
                        check.isCaseSensitive &&
                        check.string === userResponse.value
                    ) {
                        action = nodeResponse.action;
                        break;
                    }
                } else if (check.type === 'regex') {
                    const regex = new RegExp(check.regex, check.regexFlags);
                    if (regex.test(userResponse.value)) {
                        action = nodeResponse.action;
                        break;
                    }
                } else {
                    throw Error(
                        // @ts-ignore
                        `Unknown check type: ${check.type}. ${JSON.stringify(
                            check
                        )}`
                    );
                }
            }
            if (typeof action === 'undefined') {
                action = {
                    type: 'message',
                    message: node.fallthroughResponse,
                };
            }

            if (action.type === 'message') {
                nodeStates[nodeIndex] = {
                    ...nodeStates[nodeIndex],
                    nodeData: {
                        ...nodeStates[nodeIndex].nodeData,
                        value: userResponse.value,
                        response: action.message,
                    } as NodeDataTextInput,
                };
            } else if (action.type === 'goto') {
                nodeStates[nodeIndex] = {
                    ...nodeStates[nodeIndex],
                    nodeData: {
                        ...nodeStates[nodeIndex].nodeData,
                        value: userResponse.value,
                        response: undefined,
                    } as NodeDataTextInput,
                };
                nextNodeId = action.goto;
            } else {
                throw Error(
                    // @ts-ignore
                    `Unknown action type: ${action.type}. ${JSON.stringify(
                        action
                    )}`
                );
            }
        } else {
            nodeStates = puzzleState.nodeStates;
            nodeStates[nodeIndex] = {
                ...nodeStates[nodeIndex],
                nodeData: {
                    ...nodeStates[nodeIndex].nodeData,
                    value: userResponse.value,
                } as NodeDataTextInput,
            };
        }
    } else if (userResponse.type === 'option' && node.type === 'option-input') {
        nodeStates[nodeIndex] = {
            ...nodeStates[nodeIndex],
            nodeData: {
                ...nodeStates[nodeIndex].nodeData,
                value: userResponse.value,
            } as NodeDataOptionInput,
        };

        const option = node.options[userResponse.value];

        if (typeof option.oneUseFlag !== 'undefined') {
            if (option.oneUseFlag.type === 'local') {
                nextLocalData = {
                    ...nextLocalData,
                    flags: {
                        ...nextLocalData?.flags,
                        [option.oneUseFlag.key]: true,
                    },
                };
            } else if (option.oneUseFlag.type === 'global') {
                setGlobalFlag(option.oneUseFlag.key, true);
            } else {
                throw Error(
                    'Invalid flag type: ' + JSON.stringify(option.oneUseFlag)
                );
            }
        }

        nextNodeId = option.goto;
    } else if (
        userResponse.type === 'click-image' &&
        node.type === 'click-image-input'
    ) {
        const nodeIndex = userResponse.nodeIndex;

        const { clickX, clickY } = userResponse;
        const pixelColor = await getImagePixel(node.clickMap, clickX, clickY);

        nodeStates[nodeIndex] = {
            ...nodeStates[nodeIndex],
            nodeData: {
                ...nodeStates[nodeIndex].nodeData,
                clickX: clickX,
                clickY: clickY,
                response: node.fallthroughResponse,
            } as NodeDataClickImageInput,
        };

        if (!node.clickActions.hasOwnProperty(pixelColor)) {
            nodeStates[nodeIndex] = {
                ...nodeStates[nodeIndex],
                nodeData: {
                    ...nodeStates[nodeIndex].nodeData,
                    response: node.fallthroughResponse,
                } as NodeDataClickImageInput,
            };
        } else {
            const action = node.clickActions[pixelColor];
            if (action.type === 'message') {
                nodeStates[nodeIndex] = {
                    ...nodeStates[nodeIndex],
                    nodeData: {
                        response: action.message,
                    } as NodeDataTextInput,
                };
            } else if (action.type === 'goto') {
                nodeStates[nodeIndex] = {
                    ...nodeStates[nodeIndex],
                    nodeData: {
                        ...nodeStates[nodeIndex].nodeData,
                        response: undefined,
                    } as NodeDataTextInput,
                };
                nextNodeId = action.goto;
            } else {
                throw Error(
                    // @ts-ignore
                    `Unknown action type: ${action.type}. ${JSON.stringify(
                        action
                    )}`
                );
            }
        }
    } else {
        throw Error(
            `Invalid action. userResponse: ${JSON.stringify(
                userResponse
            )}, puzzleState: ${JSON.stringify(puzzleState)}`
        );
    }

    if (typeof nextNodeId !== 'undefined') {
        nodeStates = [
            ...nodeStates,
            ...stepThroughPuzzleStates(
                puzzle,
                nextNodeId,
                nextLocalData,
                uidGenerator
            ),
        ];
    }

    return {
        _nextStateUid: uidGenerator(),
        nodeStates: nodeStates,
    };
}

export function stepThroughPuzzleStates(
    puzzle: Puzzle,
    startNodeId: string,
    previousLocalData: LocalData,
    uidGenerator: UidGenerator
): NodeState[] {
    const nodeStates: NodeState[] = [];
    let currentNodeId = startNodeId;
    while (!!currentNodeId) {
        const currentNode = puzzle.nodes[currentNodeId];
        switch (currentNode.type) {
            case 'html':
                nodeStates.push({
                    _uid: uidGenerator(),
                    nodeId: currentNodeId,
                    localData: previousLocalData,
                    nodeData: {},
                });
                currentNodeId = currentNode.goto;
                break;
            case 'text-input':
                nodeStates.push({
                    _uid: uidGenerator(),
                    nodeId: currentNodeId,
                    localData: previousLocalData,
                    nodeData: {
                        value: '',
                    },
                });
                currentNodeId = undefined;
                break;
            case 'option-input':
                const availableOptions = currentNode.options.filter(
                    (option) => {
                        if (
                            typeof option.showFlag !== 'undefined' &&
                            !getFlag(option.showFlag, previousLocalData)
                        ) {
                            return false;
                        }

                        if (
                            typeof option.oneUseFlag !== 'undefined' &&
                            getFlag(option.oneUseFlag, previousLocalData)
                        ) {
                            return false;
                        }

                        return true;
                    }
                );
                if (availableOptions.length > 0) {
                    nodeStates.push({
                        _uid: uidGenerator(),
                        nodeId: currentNodeId,
                        localData: previousLocalData,
                        nodeData: {
                            value: '',
                        },
                    });
                    currentNodeId = undefined;
                } else {
                    currentNodeId = currentNode.fallthroughGoto;
                    continue;
                }
                break;
            case 'click-image-input':
                nodeStates.push({
                    _uid: uidGenerator(),
                    nodeId: currentNodeId,
                    localData: previousLocalData,
                    nodeData: {
                        clickX: -1,
                        clickY: -1,
                    },
                });
                currentNodeId = undefined;
                break;
            case 'goto':
                currentNodeId = currentNode.goto;
                break;
            case 'set-flag':
                if (currentNode.flag.type === 'local') {
                    previousLocalData = {
                        ...previousLocalData,
                        flags: {
                            ...previousLocalData.flags,
                            [currentNode.flag.key]: currentNode.value ?? true,
                        },
                    };
                } else if (currentNode.flag.type === 'global') {
                    setGlobalFlag(
                        currentNode.flag.key,
                        currentNode.value ?? true
                    );
                }
                currentNodeId = currentNode.goto;
                break;
            case 'check-flag':
                const isFlagSet = getFlag(currentNode.flag, previousLocalData);
                currentNodeId = isFlagSet
                    ? currentNode.gotoIfTrue
                    : currentNode.gotoIfFalse;
                break;
            case 'penalty-kick-to-start':
                nodeStates.push({
                    _uid: uidGenerator(),
                    nodeId: currentNodeId,
                    localData: previousLocalData,
                    nodeData: {
                        timeStart: getNowMs(),
                    },
                });
                currentNodeId = undefined;
                break;
            case 'set-completed-flag':
                localStorage['star-detective'] = '1';
                currentNodeId = currentNode.goto;
                break;
            default:
                throw Error(
                    `Invalid node type: (ID: ${JSON.stringify(currentNodeId)})`
                );
        }
    }

    return nodeStates;
}

type UidGenerator = () => number;

function initUidGenerator(nextUid: number): UidGenerator {
    return () => nextUid++;
}

export function getFlag(flag: Flag, localData: LocalData): undefined | boolean {
    switch (flag.type) {
        case 'local':
            return localData.flags[flag.key];
        case 'global':
            return getGlobalFlag(flag.key);
        default:
            throw Error('Invalid flag type: ' + JSON.stringify(flag));
    }
}

function getGlobalFlag(flagKey: string): boolean | undefined {
    const state = JSON.parse(localStorage['LIFC-2022A-MURDER-MYSTERY'] || '{}');
    return state[flagKey] as boolean | undefined;
}

function setGlobalFlag(flagKey: string, value: boolean) {
    const state = JSON.parse(localStorage['LIFC-2022A-MURDER-MYSTERY'] || '{}');
    state[flagKey] = value;
    localStorage['LIFC-2022A-MURDER-MYSTERY'] = JSON.stringify(state);
}
