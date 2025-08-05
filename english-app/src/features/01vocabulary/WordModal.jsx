import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';

const WordModal = ({ wordData, onClose, visible }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [feedback, setFeedback] = useState([]);
    const [colorHistory, setColorHistory] = useState([]);
    const [mistypedBefore, setMistypedBefore] = useState([]);
    const [startTime, setStartTime] = useState(null);
    const [proMode, setProMode] = useState(false);
    const inputRef = useRef(null);

    const phrase = wordData?.word || '';

    useEffect(() => {
        if (visible) {
            reset();
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [visible, wordData]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.altKey) {
                e.preventDefault();
                reset();
                return;
            }

            if (!visible || !phrase) return;

            if (!startTime) setStartTime(Date.now());

            if (e.key === 'Backspace') {
                if (currentIndex > 0) {
                    const newIndex = currentIndex - 1;
                    setCurrentIndex(newIndex);
                    setFeedback(prev => prev.slice(0, -1));
                    setColorHistory(prev => prev.slice(0, -1));
                }
                return;
            }

            if (e.key.length !== 1 || currentIndex >= phrase.length) return;

            const expectedChar = phrase[currentIndex];
            const typedChar = e.key;
            let color = 'red';

            const wasMistyped = mistypedBefore[currentIndex] || false;

            if (typedChar === expectedChar) {
                color = wasMistyped ? 'yellow' : 'green';
            } else {
                color = 'red';
            }

            // Update mistypedBefore array
            const newMistypedBefore = [...mistypedBefore];
            if (color === 'red') {
                newMistypedBefore[currentIndex] = true;
            } else {
                newMistypedBefore[currentIndex] = wasMistyped;
            }

            const newFeedback = [...feedback];
            newFeedback.push({ expected: expectedChar, typed: typedChar, color });

            const newColorHistory = [...colorHistory];
            newColorHistory[currentIndex] = color;

            setFeedback(newFeedback);
            setColorHistory(newColorHistory);
            setMistypedBefore(newMistypedBefore);
            setCurrentIndex(currentIndex + 1);

            if (proMode && color === 'red') {
                setTimeout(() => reset(), 100);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, feedback, colorHistory, mistypedBefore, startTime, visible, proMode]);

    const reset = () => {
        setCurrentIndex(0);
        setFeedback([]);
        setColorHistory([]);
        setMistypedBefore([]);
        setStartTime(null);
        inputRef.current?.focus();
    };

    const renderLetters = () => {
        return phrase.split('').map((char, index) => {
            const isCurrent = index === currentIndex;
            const color = colorHistory[index];
            const bg =
                color === 'green' ? 'lightgreen' :
                    color === 'red' ? '#ffb3b3' :
                        color === 'yellow' ? '#ffff99' :
                            isCurrent ? '#e0e0e0' : 'transparent';

            return (
                <span
                    key={index}
                    style={{
                        backgroundColor: bg,
                        textDecoration: isCurrent ? 'underline' : 'none',
                        fontWeight: isCurrent ? 'bold' : 'normal',
                        padding: '0 2px',
                    }}
                >
                    {char}
                </span>
            );
        });
    };

    if (!wordData) return null;

    return (
        <Dialog
            header={wordData.word}
            visible={visible}
            style={{ width: '50vw', minWidth: '300px' }}
            modal
            onHide={onClose}
            closeOnEscape
            dismissableMask
            breakpoints={{ '960px': '75vw', '640px': '90vw' }}
        >
            <input ref={inputRef} style={{ opacity: 0, position: 'absolute' }} />

            <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
                {renderLetters()}
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <Checkbox inputId="proMode" checked={proMode} onChange={e => setProMode(e.checked)} />
                <label htmlFor="proMode" style={{ marginLeft: '0.5rem' }}>Pro Mode</label>
            </div>

            <p style={{ whiteSpace: 'pre-wrap' }}>
                {(wordData.explanation || '') + ' - ' + (wordData.association || '')}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <Button label="Close" onClick={onClose} />
            </div>
        </Dialog>
    );
};

export default WordModal;
