import React, { FunctionComponent, useEffect, useState } from 'react';
import { Puzzle, PuzzlePenalty } from '../types/puzzle';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import PasscodeInput from './passcode-input';
import PuzzleDisplay from './puzzle-display';
import PenaltyDelay from './penalty-delay';

import style from './page.module.scss';
import { getPuzzleFromCode } from '../puzzle';
import { isCreditPage } from '../utils/credit-util';

const UI_TRANSITION_DURATION =
    parseFloat(style.uiTransitionDurationSeconds) * 1000;

type UIState = 'passcode' | 'puzzle' | 'delay';
const DEFAULT_UI_STATE: UIState = 'passcode' || 'delay' || 'passcode';

const UI_TRANSITION_CLASSNAMES = {
    appearActive: style.appear,
    appearDone: style.appearActive,
    enterActive: style.appear,
    enterDone: style.appearActive,
    exit: style.exit,
    exitActive: style.exitActive,
    exitDone: style.exitDone,
};

const Page: FunctionComponent = (props) => {
    const [currentUi, setCurrentUi] = useState(DEFAULT_UI_STATE as UIState);
    const [currentPuzzle, setCurrentPuzzle] = useState(
        undefined as undefined | Puzzle
    );
    const [currentPenalty, setCurrentPenalty] = useState(
        undefined as undefined | PuzzlePenalty
    );

    useEffect(() => {
        if (!isCreditPage()) {
            return;
        }

        setCurrentUi('puzzle');
        setCurrentPuzzle(getPuzzleFromCode('CREDIT'));
    }, []);

    function onActivatePuzzle(puzzle: Puzzle) {
        setCurrentUi('puzzle');
        setCurrentPuzzle(puzzle);
    }

    function handleBackButtonClicked() {
        setCurrentUi('passcode');
        setCurrentPuzzle(undefined);
        setTimeout(() => {
            if (typeof window === 'undefined') {
                return;
            }
            document.body.click();
        }, UI_TRANSITION_DURATION * 3);
    }

    useEffect(() => {
        if (typeof currentPenalty === 'undefined') {
            return;
        }

        switch (currentPenalty.type) {
            case 'kick-to-start': {
                setCurrentUi('delay');
                break;
            }
            default:
                throw Error(
                    // @ts-ignore
                    `Invalid penalty type: ${
                        currentPenalty.type
                    }. ${JSON.stringify(currentPenalty)}`
                );
        }
    }, [currentPenalty]);

    function clearPenalty() {
        // setCurrentPenalty(undefined);
        setCurrentUi('passcode');
        setCurrentPuzzle(undefined);
        setTimeout(() => {
            if (typeof window === 'undefined') {
                return;
            }
            document.body.click();
        }, UI_TRANSITION_DURATION * 3);
    }

    return (
        <TransitionGroup component={null}>
            {currentUi === 'passcode' && (
                <CSSTransition
                    key="passcode"
                    timeout={UI_TRANSITION_DURATION}
                    classNames={UI_TRANSITION_CLASSNAMES}>
                    <div className={style.transitionContainer}>
                        <PasscodeInput
                            isActive={typeof currentPuzzle === 'undefined'}
                            onActivatePuzzle={onActivatePuzzle}
                        />
                    </div>
                </CSSTransition>
            )}
            {currentUi === 'puzzle' && (
                <CSSTransition
                    key="puzzle"
                    timeout={UI_TRANSITION_DURATION}
                    classNames={UI_TRANSITION_CLASSNAMES}>
                    <div className={style.transitionContainer}>
                        {isCreditPage() ? null : (
                            <BackButton onClick={handleBackButtonClicked} />
                        )}
                        <PuzzleDisplay
                            puzzle={currentPuzzle}
                            onPenalty={setCurrentPenalty}
                        />
                    </div>
                </CSSTransition>
            )}
            {currentUi === 'delay' && (
                <CSSTransition
                    key="delay"
                    timeout={UI_TRANSITION_DURATION}
                    classNames={UI_TRANSITION_CLASSNAMES}>
                    <div className={style.transitionContainer}>
                        <PenaltyDelay
                            content={currentPenalty?.content ?? ''}
                            timeEnd={currentPenalty?.timeEnd ?? Infinity}
                            onDone={clearPenalty}
                        />
                    </div>
                </CSSTransition>
            )}
        </TransitionGroup>
    );
};

type BackButtonProps = {
    onClick: () => void;
};

const BackButton: FunctionComponent<BackButtonProps> = (props) => {
    const { onClick } = props;

    return (
        <button className={style.backButton} onClick={onClick}>
            <svg
                className={style.backbuttonChevron}
                width="24px"
                height="24px"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M15 4L7 12L15 20"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </button>
    );
};

export default Page;
