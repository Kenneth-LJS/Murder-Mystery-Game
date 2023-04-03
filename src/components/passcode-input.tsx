import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import { getPuzzleFromCode } from '../puzzle';
import { Puzzle } from '../types/puzzle';

import style from './passcode-input.module.scss';

const CORRECT_PASSCODE_ANIMATION_DURATION = 1000;
const RESET_PASSCODE_DELAY = 3000;

type PasscodeInputProps = {
    isActive: boolean;
    onActivatePuzzle: (puzzle: Puzzle) => void;
};

const PasscodeInput: FunctionComponent<PasscodeInputProps> = (props) => {
    const { isActive: isActiveProp, onActivatePuzzle } = props;

    const isMounted = useRef(false);

    const passcodeInputRef = useRef(null as HTMLInputElement);
    const [passcodeInputVal, setPasscodeInputVal] = useState('');
    const [isPasscodeInputShaking, setIsPasscodeInputShaking] = useState(false);
    const [hasCorrectPasscode, setHasCorrectPasscode] = useState(false);

    const isActive = isActiveProp && !hasCorrectPasscode;

    function onPasscodeInputKeydown(
        event: React.KeyboardEvent<HTMLInputElement>
    ) {
        if (!isActive) {
            event.preventDefault();
            return;
        }
        if (event.key.length > 1) {
            return;
        }
        const charCode = event.key.charCodeAt(0);

        // if (48 <= charCode && charCode <= 57) {
        //     // number
        //     return;
        // } else if (65 <= charCode && charCode <= 90) {
        //     // uppercase character
        //     return;
        // } else if (97 <= charCode && charCode <= 122) {
        //     // lowercase character
        //     return;
        // }

        if (65 <= charCode && charCode <= 90) {
            // uppercase character
            return;
        } else if (97 <= charCode && charCode <= 122) {
            // lowercase character
            return;
        }
        
        event.preventDefault();
    }

    function onPasscodeInputChange(event: React.ChangeEvent<HTMLInputElement>) {
        const newVal = event.target.value;
        setPasscodeInputVal(newVal);
        if (newVal.length === 6) {
            checkPasscode(newVal);
        }
    }

    function checkPasscode(passcode: string) {
        const puzzle = getPuzzleFromCode(passcode);
        if (typeof puzzle === 'undefined') {
            setIsPasscodeInputShaking(true);
            setTimeout(() => {
                if (!isMounted.current) {
                    return;
                }
                setIsPasscodeInputShaking(false);
            }, 500);
        } else {
            setHasCorrectPasscode(true);
            passcodeInputRef.current.blur();
            setTimeout(() => {
                if (!isMounted.current) {
                    return;
                }
                onActivatePuzzle(puzzle);
            }, CORRECT_PASSCODE_ANIMATION_DURATION);
            setTimeout(() => {
                if (!isMounted.current) {
                    return;
                }
                setPasscodeInputVal('');
                setHasCorrectPasscode(false);
            }, RESET_PASSCODE_DELAY);
        }
    }

    useEffect(() => {
        if (!isActive) {
            return;
        }
        function handleClick() {
            passcodeInputRef.current.focus();
        }
        document.addEventListener('click', handleClick);
        return () => {
            document.removeEventListener('click', handleClick);
        };
    }, [isActive, passcodeInputRef.current]);

    useEffect(() => {
        passcodeInputRef.current.focus();
    }, []);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        }
    }, []);

    return (
        <div
            className={classnames(style.container, isActive || style.inactive)}>
            <input
                ref={passcodeInputRef}
                className={classnames(
                    style.display,
                    isPasscodeInputShaking && style.incorrectPasscode,
                    hasCorrectPasscode && style.correctPasscode
                )}
                value={passcodeInputVal}
                maxLength={6}
                spellCheck="false"
                autoComplete="off"
                onKeyDown={onPasscodeInputKeydown}
                onChange={onPasscodeInputChange}
            />
        </div>
    );
};

export default PasscodeInput;
