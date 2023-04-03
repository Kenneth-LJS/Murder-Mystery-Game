import React, {
    createElement,
    Fragment,
    FunctionComponent,
    ReactElement,
    ReactNode,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import {
    getFlag,
    getPuzzleAsset,
    initializePuzzleState,
    processPuzzleHtml,
    processPuzzleState,
} from '../puzzle';
import {
    NodeHtml,
    NodeOptionInput,
    NodeState,
    NodeDataOptionInput,
    NodeDataTextInput,
    NodeTextInput,
    Puzzle,
    PuzzleState,
    UserResponse,
    NodeClickImageInput,
    NodeDataClickImageInput,
    PuzzlePenalty,
    NodeDataPenaltyKickToStart,
} from '../types/puzzle';
import parse, {
    attributesToProps,
    DOMNode,
    domToReact,
    HTMLReactParserOptions,
} from 'html-react-parser';
import classnames from 'classnames';

import style from './puzzle-display.module.scss';

type PuzzleDisplayProps = {
    puzzle: Puzzle;
    onPenalty: (penalty: PuzzlePenalty) => void;
};

const NODE_TRANSITION_CLASSNAMES = {
    appearActive: style.appear,
    appearDone: style.appearActive,
    enterActive: style.appear,
    enterDone: style.appearActive,
    exit: style.exit,
    exitDone: style.exitDone,
};

const PuzzleDisplay: FunctionComponent<PuzzleDisplayProps> = (props) => {
    const { puzzle, onPenalty } = props;
    const [puzzleState, handleUserResponse] = usePuzzleState(puzzle);

    if (typeof puzzle === 'undefined') {
        return null;
    }

    return (
        <div className={style.container}>
            <div className={style.content}>
                <TransitionGroup component={null}>
                    {puzzleState.nodeStates.map((nodeState, nodeIndex) => (
                        <CSSTransition
                            key={nodeState._uid}
                            timeout={200}
                            classNames={NODE_TRANSITION_CLASSNAMES}>
                            <div className={style.nodeTransitionContainer}>
                                <PuzzleNodeDisplay
                                    puzzle={puzzle}
                                    onPenalty={onPenalty}
                                    nodeState={nodeState}
                                    onUserResponse={handleUserResponse}
                                    nodeIndex={nodeIndex}
                                />
                            </div>
                        </CSSTransition>
                    ))}
                </TransitionGroup>
            </div>
        </div>
    );
};

export default PuzzleDisplay;

function usePuzzleState(
    puzzle: Puzzle
): [PuzzleState, (userResponse: UserResponse) => void] {
    const [puzzleState, setPuzzleState] = useState({
        nodeStates: [],
    } as PuzzleState);

    useEffect(() => {
        if (typeof puzzle === 'undefined') {
            return;
        }
        // reset puzzleState every time the puzzle is changed
        setPuzzleState(initializePuzzleState(puzzle));
    }, [puzzle]);

    async function handleUserResponse(userResponse: UserResponse) {
        const newPuzzleState = await processPuzzleState(
            puzzle,
            puzzleState,
            userResponse
        );

        setPuzzleState(newPuzzleState);
    }

    return [puzzleState, handleUserResponse];
}

type PuzzleNodeDisplayProps = {
    puzzle: Puzzle;
    onPenalty: (penalty: PuzzlePenalty) => void;
    nodeState: NodeState;
    nodeIndex: number;
    onUserResponse: (userResponse: UserResponse) => void;
};

const PuzzleNodeDisplay: FunctionComponent<PuzzleNodeDisplayProps> = (
    props
) => {
    const { puzzle, onPenalty, nodeState } = props;
    const node = puzzle.nodes[nodeState.nodeId];
    switch (node.type) {
        case 'html':
            return <PuzzleNodeDisplayHtml {...props} />;
        case 'text-input':
            return <PuzzleNodeDisplayTextInput {...props} />;
        case 'option-input':
            return <PuzzleNodeDisplayOptionInput {...props} />;
        case 'click-image-input':
            return <PuzzleNodeDisplayClickImageInput {...props} />;
        case 'penalty-kick-to-start': {
            onPenalty({
                type: 'kick-to-start',
                content: node.content,
                timeEnd:
                    (nodeState.nodeData as NodeDataPenaltyKickToStart)
                        .timeStart + node.delay,
            });
            return null;
        }
        default:
            throw Error(
                // @ts-ignore
                `Invalid node type: ${node.type}. ${JSON.stringify(node)}`
            );
    }
};

const PuzzleNodeDisplayHtml: FunctionComponent<PuzzleNodeDisplayProps> = (
    props
) => {
    const { puzzle, nodeState } = props;
    const node = puzzle.nodes[nodeState.nodeId] as NodeHtml;
    return <>{makeElement(node.content)}</>;
};

const PuzzleNodeDisplayTextInput: FunctionComponent<PuzzleNodeDisplayProps> = (
    props
) => {
    const { puzzle, nodeState, nodeIndex, onUserResponse } = props;
    const node = puzzle.nodes[nodeState.nodeId] as NodeTextInput;
    const nodeData = nodeState.nodeData as NodeDataTextInput;

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (
        event
    ) => {
        onUserResponse({
            type: 'text',
            value: event.currentTarget.value,
            isEnter: false,
            nodeIndex: nodeIndex,
        });
    };

    const handleKeydown: React.KeyboardEventHandler<HTMLInputElement> = (
        event
    ) => {
        if (event.key !== 'Enter') {
            return;
        }
        onUserResponse({
            type: 'text',
            value: event.currentTarget.value,
            isEnter: true,
            nodeIndex: nodeIndex,
        });
    };

    return (
        <div className={style.textInputNodeContainer}>
            {node.prompt && (
                <div className={style.textInputPrompt}>{node.prompt}</div>
            )}
            <div className={style.textInputContainer}>
                <input
                    className={style.textInput}
                    value={nodeData.value}
                    onChange={handleChange}
                    onKeyDown={handleKeydown}
                />
            </div>
            {nodeData.response && (
                <div className={style.textInputResponse}>
                    {nodeData.response}
                </div>
            )}
        </div>
    );
};

const PuzzleNodeDisplayOptionInput: FunctionComponent<
    PuzzleNodeDisplayProps
> = (props) => {
    const { puzzle, nodeState, nodeIndex, onUserResponse } = props;
    const node = puzzle.nodes[nodeState.nodeId] as NodeOptionInput;
    const nodeData = nodeState.nodeData as NodeDataOptionInput;

    function makeHandleOptionClick(index: number) {
        const handleOptionClick: React.MouseEventHandler<HTMLAnchorElement> = (
            event
        ) => {
            if (event.ctrlKey) {
                return;
            }
            event.preventDefault();
            event.currentTarget.blur();
            onUserResponse({
                type: 'option',
                value: index,
                nodeIndex: nodeIndex,
            });
        };

        return handleOptionClick;
    }

    return (
        <ul className={style.optionInputContainer}>
            {node.options.map((option, optionIndex) => {
                if (
                    typeof option.showFlag !== 'undefined' &&
                    !getFlag(option.showFlag, nodeState.localData)
                ) {
                    return null;
                } else if (
                    typeof option.oneUseFlag !== 'undefined' &&
                    getFlag(option.oneUseFlag, nodeState.localData)
                ) {
                    return null;
                }
                return (
                    <li key={optionIndex} className={style.optionInputItem}>
                        <a
                            className={classnames(
                                style.optionInputItemText,
                                optionIndex === nodeData.value && style.selected
                            )}
                            href=""
                            onClick={makeHandleOptionClick(optionIndex)}>
                            {makeElement(option.label)}
                        </a>
                    </li>
                );
            })}
        </ul>
    );
};

const PuzzleNodeDisplayClickImageInput: FunctionComponent<
    PuzzleNodeDisplayProps
> = (props) => {
    const { puzzle, nodeState, nodeIndex, onUserResponse } = props;
    const node = puzzle.nodes[nodeState.nodeId] as NodeClickImageInput;
    const nodeData = nodeState.nodeData as NodeDataClickImageInput;

    const handleClick: React.MouseEventHandler<HTMLImageElement> = (event) => {
        const target = event.currentTarget;

        const rawX = event.pageX - target.offsetLeft;
        const rawY = event.pageY - target.offsetTop;

        const x = Math.round(target.naturalWidth * rawX / target.offsetWidth);
        const y = Math.round(target.naturalHeight * rawY / target.offsetHeight);

        onUserResponse({
            type: 'click-image',
            clickX: x,
            clickY: y,
            nodeIndex: nodeIndex,
        });
    };

    return (
        <div className={style.clickImageNodeContainer}>
            {node.prompt && (
                <div className={style.clickImagePrompt}>{node.prompt}</div>
            )}
            <div className={style.clickImageContainer}>
                <img
                    className={style.clickImageImage}
                    src={getPuzzleAsset(node.image)}
                    onClick={handleClick}
                />
            </div>
            {nodeData.response && (
                <div className={style.clickImageInputResponse}>
                    {nodeData.response}
                </div>
            )}
        </div>
    );
};

const elementParseOptions: HTMLReactParserOptions = {
    replace: (domNodeInput) => {
        let domNode = domNodeInput as {
            name: string;
            attribs?: { class?: string };
            children?: DOMNode[];
        };
        if (!domNode.attribs) {
            return;
        } else if (!domNode.attribs.class) {
            return;
        }
        const classes = domNode.attribs.class.split(' ');
        if (!classes.includes('link')) {
            return;
        }
        domNode.attribs.class = classes
            .map((c) => (c === 'link' ? style.link : c))
            .join(' ');
        return createElement(
            domNode.name,
            attributesToProps(domNode.attribs),
            domToReact(domNode.children, elementParseOptions),
        );
    },
};

function makeElement(html: string): ReactNode {
    const processedHtml = useMemo(() => processPuzzleHtml(html), [html]);
    return parse(processedHtml, elementParseOptions);
}
