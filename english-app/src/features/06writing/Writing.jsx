import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { fetchAuthUser } from '../loginModal/authSlice';
import { fetchWritingPrompts, addWritingPrompt, deleteWritingPrompt } from './writingSlice';

const FloatingInput = ({ id, label, value, onChange, disabled }) => (
    <span
        className="p-float-label"
        style={{
            flex: '1 1 200px',
            minWidth: '200px',
            display: 'inline-flex',
            flexDirection: 'column',
        }}
    >
    <InputText
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full"
        placeholder=" "
    />
    <label htmlFor={id}>{label}</label>
  </span>
);


const DEFAULT_PROMPT = { id: 'default', prompt: 'Write about your favorite memory.' };

export default function Writing() {
    const dispatch = useDispatch();
    const toastRef = useRef(null);

    const { user } = useSelector((state) => state.auth);
    const { prompts } = useSelector((state) => state.writing);

    const [theme, setTheme] = useState(localStorage.getItem('writingTheme') || '');
    const [text, setText] = useState(localStorage.getItem('writingText') || '');
    const [timer, setTimer] = useState(parseInt(localStorage.getItem('writingTimer')) || 0);
    const [isTyping, setIsTyping] = useState(false);
    const intervalRef = useRef(null);
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

    useEffect(() => {
        localStorage.setItem('writingTimer', timer.toString());
    }, [timer]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) stopTimer();
        };
        const handleBlur = () => stopTimer();

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);

    const startTimer = () => {
        if (!isTyping) {
            setIsTyping(true);
            intervalRef.current = setInterval(() => {
                setTimer((t) => t + 1);
            }, 1000);
        }
    };

    const stopTimer = () => {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsTyping(false);
    };

    const handleReset = () => {
        stopTimer();
        setTimer(0);
        setTheme('');
        setText('');
        localStorage.removeItem('writingTheme');
        localStorage.removeItem('writingText');
        localStorage.removeItem('writingTimer');
    };

    const handleAddPrompt = () => {
        if (!newPrompt.trim()) return;
        dispatch(addWritingPrompt({ prompt: newPrompt, userId: user.id }))
            .unwrap()
            .then(() => setNewPrompt(''))
            .catch(() =>
                toastRef.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to add prompt'
                })
            );
    };

    const handleDeletePrompt = (id) => {
        if (id === 'default') return;
        confirmDialog({
            message: 'Are you sure you want to delete this prompt?',
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: () => dispatch(deleteWritingPrompt({ promptId: id, userId: user.id }))
        });
    };

    const redirectToChatGPT = (prompt) => {
        const chatPrompt = `You are helping me practice writing. My topic is: "${theme}". 
Here is my current draft:
${text}

Now, based on this prompt: "${prompt}", please provide feedback and suggestions.`;
        const encodedPrompt = encodeURIComponent(chatPrompt);
        window.open(`https://chat.openai.com/?model=gpt-4&prompt=${encodedPrompt}`, '_blank');
    };

    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const totalPrompts = [DEFAULT_PROMPT, ...prompts];

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <Toast ref={toastRef} />
                <ConfirmDialog />

                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">✍️ Writing Practice</h1>
                    <p className="text-lg text-gray-600">Express your thoughts and improve your writing skills</p>
                </div>

                <div className="space-y-6">
                    <Card className="shadow-lg border-0">
                        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                        <div className="p-8 flex flex-col items-center" style={{ display: 'grid', justifyContent: 'center', alignItems: 'center' }}>
                            <div className="mb-8 w-full max-w-2xl">
                                <FloatingInput
                                    id="writingTheme"
                                    label="Writing theme"
                                    value={theme}
                                    onChange={(e) => setTheme(e.target.value)}
                                />
                            </div>

                            <div className="mb-8 w-full max-w-4xl">
                                <InputTextarea
                                    rows={20}
                                    cols={100}
                                    placeholder="Start writing your thoughts here..."
                                    value={text}
                                    onKeyDown={startTimer}
                                    onChange={(e) => setText(e.target.value)}
                                    onBlur={stopTimer}
                                    className="w-full p-6 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors resize-none"
                                    style={{ marginTop: '5px' }}
                                />
                            </div>
                        </div>
                        </div>

                        <div>
                        <Card className="shadow-lg border-0" style={{ overflow: 'auto', height: '450px', minWidth: '600px' }}>
                            <div className="p-6">
                                <div className="text-center ">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Writing Prompts</h3>
                                    <p className="text-gray-600">Get inspired with creative writing prompts</p>
                                </div>

                                <div className="mt-6">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">Add New Prompt</h4>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <InputText
                                            value={newPrompt}
                                            onChange={(e) => setNewPrompt(e.target.value)}
                                            placeholder="Enter your custom writing prompt..."
                                            className="flex-1 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 transition-colors"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddPrompt()}
                                        />
                                        <Button label="Add Prompt" icon="pi pi-plus" onClick={handleAddPrompt} disabled={!newPrompt.trim()} className="p-button-success px-6" />
                                    </div>
                                </div>

                                <Divider />

                                <div className="space-y-4 mb-6">
                                    {totalPrompts.map((p, index) => (
                                        <div key={p.id} className="group">
                                            <div className="flex items-center gap-4 p-4 bg-white border-2 border-gray-100 rounded-lg hover:border-blue-200 hover:shadow-md transition-all">
                                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-gray-800 font-medium">{p.prompt}</p>
                                                </div>
                                                <div className="flex items-center gap-2 opacity-75 group-hover:opacity-100 transition-opacity">
                                                    <Button icon="pi pi-comments" className="p-button-text p-button-help p-button-sm" onClick={() => redirectToChatGPT(p.prompt)} tooltip="Send to ChatGPT" />
                                                    <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => handleDeletePrompt(p.id)} disabled={p.id === 'default'} tooltip={p.id === 'default' ? 'Cannot delete default prompt' : 'Delete prompt'} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                        </div>
                        </div>
                    </Card>

                    <div className="flex flex-wrap items-center justify-center gap-8 p-8 bg-white shadow-lg rounded-xl border-0"
                    style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row', gap: '1rem', padding: '1rem'}}>
                        <div className="flex items-center gap-4">
                            <i className="pi pi-file-word text-blue-500 text-4xl"></i>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-gray-900">{wordCount}</div>
                                <div className="text-lg font-semibold text-gray-600">Words</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button label="Reset All" icon="pi pi-refresh" className="p-button-outlined p-button-warning text-xl px-8 py-4" onClick={handleReset} />
                        </div>
                        <div className="flex items-center gap-4">
                            <i className="pi pi-clock text-green-500 text-4xl"></i>
                            <div className="text-center">
                                <div className={`text-3xl font-bold ${isTyping ? 'text-green-600 animate-pulse' : 'text-gray-900'}`}>
                                    {formatTime(timer)}
                                </div>
                                <div className="text-lg font-semibold text-gray-600">Time</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
