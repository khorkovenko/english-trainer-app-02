import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { fetchAuthUser } from '../loginModal/authSlice';
import {
    fetchSpeaking,
    saveSpeaking,
    saveSpeakingPrompt,
    deleteSpeakingPrompt,
    deleteSpeaking
} from './speakingSlice';
import { Tooltip } from 'primereact/tooltip';

const FloatingInput = ({ id, label, value, onChange, disabled }) => (
    <span
        className="p-float-label"
        style={{
            flex: '1 1 200px',
            minWidth: '200px',
            display: 'inline-flex',
            flexDirection: 'column'
        }}
    >
        <InputText id={id} value={value} onChange={onChange} disabled={disabled} className="w-full" />
        <label htmlFor={id}>{label}</label>
    </span>
);

const DEFAULT_PROMPT = 'Describe the topic in detail and suggest speaking questions.';

export default function Speaking() {
    const dispatch = useDispatch();
    const toastRef = useRef(null);

    const { user } = useSelector((state) => state.auth);
    const { speaking, error } = useSelector((state) => state.speaking);

    const [newSpeaking, setNewSpeaking] = useState({ topic: '' });
    const inputRefs = useRef({});

    useEffect(() => {
        if (!user?.id) {
            dispatch(fetchAuthUser())
                .unwrap()
                .then((res) => dispatch(fetchSpeaking(res.id)));
        } else {
            dispatch(fetchSpeaking(user.id));
        }
    }, [dispatch, user]);

    const handleAddSpeaking = () => {
        if (!newSpeaking.topic.trim()) {
            toastRef.current?.show({ severity: 'warn', summary: 'Validation', detail: 'Topic is required' });
            return;
        }

        dispatch(saveSpeaking({ userId: user.id, speaking: newSpeaking }))
            .unwrap()
            .then((savedSpeaking) => {
                if (savedSpeaking?.id) {
                    return dispatch(
                        saveSpeakingPrompt({
                            speakingId: savedSpeaking.id,
                            prompt: DEFAULT_PROMPT,
                            userId: user.id
                        })
                    ).unwrap();
                } else {
                    throw new Error('No speaking ID returned');
                }
            })
            .then(() => {
                dispatch(fetchSpeaking(user.id));
                setNewSpeaking({ topic: '' });
            })
            .catch((err) => {
                console.error(err);
                toastRef.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: err.message || 'Failed to add speaking or prompt'
                });
            });
    };

    const handleAddPrompt = (speakingId, redirect = false) => {
        const inputRef = inputRefs.current[speakingId];
        const text = inputRef?.value?.trim();
        if (!text) return;

        dispatch(saveSpeakingPrompt({ speakingId, prompt: text, userId: user.id }))
            .unwrap()
            .then(() => {
                if (inputRef) inputRef.value = '';
                if (redirect) {
                    redirectToPerplexity(speakingId, text);
                }
                dispatch(fetchSpeaking(user.id));
            })
            .catch(() =>
                toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to add prompt' })
            );
    };

    const handleDeletePrompt = (promptId) => {
        confirmDialog({
            message: 'Delete this prompt?',
            acceptClassName: 'p-button-danger',
            accept: () =>
                dispatch(deleteSpeakingPrompt({ promptId, userId: user.id })).then(() =>
                    dispatch(fetchSpeaking(user.id))
                )
        });
    };

    const handleDeleteSpeaking = (speaking) => {
        confirmDialog({
            message: `Delete speaking topic "${speaking.topic}" and all its prompts?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: () =>
                dispatch(deleteSpeaking({ speakingId: speaking.id, userId: user.id })).then(() =>
                    dispatch(fetchSpeaking(user.id))
                )
        });
    };

    const redirectToPerplexity = (speakingId, prompt) => {
        const topic = speaking.find((s) => s.id === speakingId)?.topic || '';
        window.open(
            `https://www.perplexity.ai/?q=${encodeURIComponent(
                'Accordingly to this topic: ' + topic + ' generate prompt ' + prompt
            )}`,
            '_blank'
        );
    };

    const redirectToChatGPT = (topic, prompt) => {
        const chatPrompt = `Based on the speaking topic "${topic}", respond to this prompt: ${prompt}`;
        const encodedPrompt = encodeURIComponent(chatPrompt);
        window.open(`https://chat.openai.com/?model=gpt-4&prompt=${encodedPrompt}`, '_blank');
    };

    const promptsBody = (rowData) => {
        const prompts = Array.isArray(rowData.speaking_prompts) ? rowData.speaking_prompts : [];

        return (
            <div className="space-y-1">
                {prompts.length === 0 && (
                    <div className="text-sm text-gray-500 italic">No prompts yet</div>
                )}
                {prompts.map((p) => {
                    const shortCaption = p.prompt.length > 50 ? p.prompt.slice(0, 50) + '...' : p.prompt;

                    return (
                        <div
                            key={p.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                marginTop: '0.25rem'
                            }}
                        >
                            <span className="text-gray-500" style={{ fontSize: '0.8rem' }}>
                                ●
                            </span>
                            <span
                                id={`prompt-${p.id}`}
                                className="truncate flex-1 cursor-default"
                                style={{ margin: '0 15px' }}
                            >
                                {shortCaption}
                            </span>
                            <Tooltip target={`#prompt-${p.id}`} content={p.prompt} />
                            <Button
                                icon="pi pi-comments"
                                className="p-button-help p-button-sm"
                                onClick={() => redirectToChatGPT(rowData.topic, p.prompt)}
                                tooltip="Send to ChatGPT"
                            />
                            <Button
                                icon="pi pi-external-link"
                                className="p-button-info p-button-sm"
                                onClick={() => redirectToPerplexity(rowData.id, p.prompt)}
                                tooltip="Send to Perplexity"
                            />
                            <Button
                                icon="pi pi-trash"
                                className="p-button-danger p-button-sm"
                                onClick={() => handleDeletePrompt(p.id)}
                                tooltip="Delete Prompt"
                            />
                        </div>
                    );
                })}
            </div>
        );
    };

    const promptInputBody = (rowData) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            <InputText
                ref={(el) => el && (inputRefs.current[rowData.id] = el)}
                placeholder="Enter new prompt"
                className="flex-1"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPrompt(rowData.id, false);
                    }
                }}
            />
            <span
                style={{
                    color: 'var(--primary-color)',
                    fontWeight: 'bold',
                    fontSize: '1.5rem',
                    margin: '0 12px'
                }}
            >
                |
            </span>
            <Button
                icon="pi pi-plus"
                label="Add"
                className="p-button-success p-button-sm"
                onClick={() => handleAddPrompt(rowData.id, false)}
            />
        </div>
    );

    const header = (
        <div
            className="p-d-flex p-ai-center p-flex-wrap"
            style={{ gap: '0.5rem', flex: '1 1 600px' }}
        >
            <FloatingInput
                id="newTopic"
                label="Speaking Topic"
                value={newSpeaking.topic}
                onChange={(e) => setNewSpeaking({ topic: e.target.value })}
            />
            <span
                style={{
                    color: 'var(--primary-color)',
                    fontWeight: 'bold',
                    fontSize: '1.5rem',
                    margin: '0 12px'
                }}
            >
                ||
            </span>
            <Button
                label="Add Topic"
                icon="pi pi-plus"
                onClick={handleAddSpeaking}
                disabled={!newSpeaking.topic.trim()}
                className="p-button-success"
            />
        </div>
    );

    return (
        <div className="p-4">
            <Toast ref={toastRef} />
            <ConfirmDialog />
            <h2 className="text-xl font-semibold mb-4">🗣️ Speaking Practice</h2>
            <DataTable
                value={speaking}
                dataKey="id"
                emptyMessage="No speaking topics found"
                className="shadow-lg"
                paginator={speaking?.length > 10}
                rows={10}
                rowsPerPageOptions={[10, 25, 50]}
                header={header}
                onContextMenu={(e) => handleDeleteSpeaking(e.data)}
            >
                <Column field="topic" header="Topic" className="font-semibold" style={{ width: '30%' }} />
                <Column header="Prompts" body={promptsBody} style={{ width: '40%' }} />
                <Column header="Add Prompt" body={promptInputBody} style={{ width: '30%' }} />
            </DataTable>
            {error && (
                <div className="mt-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
                    <strong>Error:</strong> {error}
                </div>
            )}
        </div>
    );
}
