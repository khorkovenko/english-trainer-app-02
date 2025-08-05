import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';

const WordModal = ({ wordData, onClose, visible }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [feedback, setFeedback] = useState([]);
    const [colorHistory, setColorHistory] = useState([]);
    const [mistypedBefore, setMistypedBefore] = useState([]);
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [proMode, setProMode] = useState(false);
    const [repeatCount, setRepeatCount] = useState(1);
    const [completedCount, setCompletedCount] = useState(0);
    const [summaryList, setSummaryList] = useState([]);
    const [showFinalSummary, setShowFinalSummary] = useState(false);
    const inputRef = useRef(null);

    const phrase = wordData?.word + ' - ' + wordData?.explanation + ' - ' + wordData?.association || '';

    const reset = () => {
        setCurrentIndex(0);
        setFeedback([]);
        setColorHistory([]);
        setMistypedBefore([]);
        setStartTime(null);
        setEndTime(null);
        setShowFinalSummary(false);
    };

    const startNewGame = () => {
        reset();
        setCompletedCount(0);
        setSummaryList([]);
    };

    // reset when opened or word changes
    useEffect(() => {
        if (visible) {
            startNewGame();
        }
    }, [visible, wordData]);

    // key handling (typing game)
    useEffect(() => {
        if (!visible || !phrase) return;

        const handleKeyDown = (e) => {
            // Esc explicitly closes
            if (e.key === 'Escape') {
                onClose();
                return;
            }

            // Prevent typing game while interacting with inputs (repeat/proMode)
            const activeTag = document.activeElement?.tagName?.toLowerCase();
            if (activeTag === 'input' || activeTag === 'textarea') return;

            if (e.ctrlKey && e.altKey) {
                e.preventDefault();
                reset();
                return;
            }

            if (!startTime) setStartTime(Date.now());

            if (e.key === 'Backspace') {
                if (currentIndex > 0) {
                    setCurrentIndex(prev => prev - 1);
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

            const newMistypedBefore = [...mistypedBefore];
            newMistypedBefore[currentIndex] = color === 'red' || wasMistyped;

            const newFeedback = [...feedback, { expected: expectedChar, typed: typedChar, color }];
            const newColorHistory = [...colorHistory];
            newColorHistory[currentIndex] = color;

            setMistypedBefore(newMistypedBefore);
            setFeedback(newFeedback);
            setColorHistory(newColorHistory);
            setCurrentIndex(prev => prev + 1);

            if (proMode && color === 'red') {
                // immediate reset on mistake in pro mode
                setTimeout(() => reset(), 100);
                return;
            }

            if (currentIndex + 1 === phrase.length) {
                const now = Date.now();
                const totalMistakes = newFeedback.filter(f => f.color === 'red' || f.color === 'yellow').length;
                const accuracy = Math.round(((phrase.length - totalMistakes) / phrase.length) * 100);
                const timeTaken = ((now - (startTime || now)) / 1000).toFixed(2);
                const incorrectLetters = newFeedback
                    .map((f, i) => (f.color === 'red' ? `At ${i + 1}: expected '${f.expected}', got '${f.typed}'` : null))
                    .filter(Boolean);
                const allCorrected = newFeedback.every(f => f.color !== 'red');

                const roundSummary = {
                    accuracy,
                    timeTaken,
                    incorrectLetters,
                    allCorrected,
                    repeatNumber: completedCount + 1,
                };

                setSummaryList(prev => [...prev, roundSummary]);

                if (completedCount + 1 < repeatCount) {
                    setCompletedCount(prev => prev + 1);
                    reset();
                } else {
                    setShowFinalSummary(true);
                }

                setEndTime(now);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        currentIndex,
        feedback,
        colorHistory,
        mistypedBefore,
        startTime,
        visible,
        proMode,
        repeatCount,
        completedCount,
        phrase,
        onClose,
    ]);

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

    const renderFinalSummary = () => {
        if (!showFinalSummary || summaryList.length === 0) return null;

        return (
            <div style={{
                marginTop: '1rem',
                maxHeight: '300px',
                overflowY: 'auto',
                paddingRight: '0.5rem',
                background: '#f9f9f9',
                borderRadius: 4,
                padding: '10px',
            }}>
                <h4 style={{ marginTop: 0 }}>📊 Final Summary ({summaryList.length} rounds)</h4>
                {summaryList.map((s, index) => (
                    <div key={index} style={{ marginBottom: '1rem', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem' }}>
                        <p><strong>Round:</strong> {s.repeatNumber}</p>
                        <p><strong>Time:</strong> {s.timeTaken} s</p>
                        <p><strong>Accuracy:</strong> {s.accuracy}%</p>
                        {s.incorrectLetters.length > 0 && (
                            <>
                                <p><strong>Incorrect Inputs:</strong></p>
                                <ul>
                                    {s.incorrectLetters.map((msg, idx) => (
                                        <li key={idx}>{msg}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                        {s.allCorrected
                            ? <p>✅ All mistakes corrected.</p>
                            : <p>❌ Some letters never corrected.</p>}
                    </div>
                ))}
            </div>
        );
    };

    if (!wordData) return null;

    return (
        <Dialog
            header={
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span><strong>Word:</strong> {wordData.word}</span>
                    <span><strong>Repeat:</strong> {completedCount + 1} / {repeatCount}</span>
                    {startTime && !showFinalSummary && (
                        <>
                            <span><strong>Time:</strong> {((endTime || Date.now()) - startTime) / 1000}s</span>
                            <span><strong>Accuracy:</strong> {
                                Math.round(((phrase.length - feedback.filter(f => f.color === 'red' || f.color === 'yellow').length) / phrase.length) * 100)
                            }%</span>
                        </>
                    )}
                </div>
            }
            visible={visible}
            style={{
                width: '100vw',
                height: '100vh',
                minWidth: '100%',
                padding: 0,
                margin: 0,
                maxWidth: '100%',
                display: 'flex',
                flexDirection: 'column',
            }}
            contentStyle={{ height: 'calc(100% - 60px)', overflow: 'auto', padding: '1rem' }}
            modal
            onHide={onClose}
            closeOnEscape
            dismissableMask
            breakpoints={{}}
        >
            {/* Hidden input retained for accessibility if needed */}
            <input ref={inputRef} style={{ opacity: 0, position: 'absolute' }} aria-hidden="true" />

            <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
                {renderLetters()}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Checkbox inputId="proMode" checked={proMode} onChange={e => setProMode(e.checked)} />
                    <label htmlFor="proMode" style={{ margin: '0 0.5rem' }}>Pro Mode</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label htmlFor="repeatInput" style={{ marginRight: '0.5rem' }}>Repeat:</label>
                    <InputNumber
                        id="repeatInput"
                        value={repeatCount}
                        onValueChange={(e) => setRepeatCount(e.value || 1)}
                        min={1}
                        max={10}
                        inputStyle={{ width: '4rem' }}
                    />
                </div>
            </div>

            <p style={{ whiteSpace: 'pre-wrap' }}>
                {(wordData.explanation || '') + ' - ' + (wordData.association || '')}
            </p>

            {renderFinalSummary()}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', gap: '0.5rem' }}>
                <Button label="Restart" onClick={startNewGame} />
                <Button label="Close" onClick={onClose} />
            </div>
        </Dialog>
    );
};

export default WordModal;
