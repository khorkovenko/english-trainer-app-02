import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { fetchAuthUser } from '../loginModal/authSlice';
import { fetchWritingPrompts, addWritingPrompt, deleteWritingPrompt } from './writingSlice';

const DEFAULT_PROMPT = { id: 'default', prompt: 'Write about your favorite memory.' };

export default function Writing() {
    const dispatch = useDispatch();
    const toastRef = useRef(null);

    const { user } = useSelector((state) => state.auth);
    const { prompts } = useSelector((state) => state.writing);

    const [theme, setTheme] = useState(localStorage.getItem('writingTheme') || '');
    const [text, setText] = useState(localStorage.getItem('writingText') || '');
    const [timer, setTimer] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const [intervalId, setIntervalId] = useState(null);
    const [newPrompt, setNewPrompt] = useState('');

    useEffect(() => {
        if (!user?.id) {
            dispatch(fetchAuthUser())
                .unwrap()
                .then((res) => dispatch(fetchWritingPrompts(res.id)));
        } else {
            dispatch(fetchWritingPrompts(user.id));
        }
    }, [dispatch, user]);

    useEffect(() => {
        localStorage.setItem('writingTheme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('writingText', text);
    }, [text]);

    const handleStartTimer = () => {
        if (!isTyping) {
            setIsTyping(true);
            const id = setInterval(() => {
                setTimer((t) => t + 1);
            }, 1000);
            setIntervalId(id);
        }
    };

    const handleReset = () => {
        setTimer(0);
        setIsTyping(false);
        if (intervalId) clearInterval(intervalId);
        setTheme('');
        setText('');
        localStorage.removeItem('writingTheme');
        localStorage.removeItem('writingText');
    };

    const handleAddPrompt = () => {
        if (!newPrompt.trim()) return;
        dispatch(addWritingPrompt({ prompt: newPrompt, userId: user.id }))
            .unwrap()
            .then(() => setNewPrompt(''))
            .catch(() =>
                toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to add prompt' })
            );
    };

    const handleDeletePrompt = (id) => {
        if (id === 'default') return;
        confirmDialog({
            message: 'Delete this prompt?',
            acceptClassName: 'p-button-danger',
            accept: () => dispatch(deleteWritingPrompt({ promptId: id, userId: user.id }))
        });
    };

    const handleGoToChatGPT = (prompt) => {
        const message = `Theme: ${theme}\nText: ${text}\nPrompt: ${prompt}`;
        const encoded = encodeURIComponent(message);
        window.open(`https://chat.openai.com/?q=${encoded}`, '_blank');
    };

    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const totalPrompts = [DEFAULT_PROMPT, ...prompts];

    return (
        <div className="p-4 space-y-4 text-center">
            <Toast ref={toastRef} />
            <ConfirmDialog />
            <h2 className="text-xl font-semibold">✍️ Writing Practice</h2>

            <div className="space-y-2 max-w-xl mx-auto">
                <InputText
                    placeholder="Enter theme"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full"
                />
                <InputTextarea
                    rows={6}
                    placeholder="Start writing..."
                    value={text}
                    onFocus={handleStartTimer}
                    onKeyDown={handleStartTimer}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full"
                />
                <div className="flex items-center justify-between">
                    <div>Word Count: {wordCount}</div>
                    <div>Time: {timer}s</div>
                    <Button
                        label="Reset"
                        icon="pi pi-refresh"
                        className="p-button-warning"
                        onClick={handleReset}
                    />
                </div>
            </div>

            <div className="space-y-2 max-w-xl mx-auto">
                <h3 className="font-semibold">Prompts</h3>
                {totalPrompts.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 justify-center">
                        <span className="flex-1 text-center">{p.prompt}</span>
                        <Button
                            icon="pi pi-arrow-right"
                            className="p-button-info p-button-sm"
                            onClick={() => handleGoToChatGPT(p.prompt)}
                        />
                        <Button
                            icon="pi pi-trash"
                            className="p-button-danger p-button-sm"
                            onClick={() => handleDeletePrompt(p.id)}
                            disabled={p.id === 'default'}
                        />
                    </div>
                ))}
                <div className="flex gap-2 justify-center">
                    <InputText
                        value={newPrompt}
                        onChange={(e) => setNewPrompt(e.target.value)}
                        placeholder="New prompt"
                        className="flex-1"
                    />
                    <Button label="Add" icon="pi pi-plus" onClick={handleAddPrompt} />
                </div>
            </div>
        </div>
    );
}
