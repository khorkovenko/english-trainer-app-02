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
    fetchListenings,
    saveListening,
    saveListeningPrompt,
    deleteListeningPrompt,
    deleteListening
} from './listeningSlice';
import { Tooltip } from 'primereact/tooltip';

const FloatingInput = ({ id, label, value, onChange, disabled }) => (
    <span
        className="p-float-label"
        style={{
            flex: '1 1 160px',
            minWidth: '160px',
            display: 'inline-flex',
            flexDirection: 'column'
        }}
    >
        <InputText id={id} value={value} onChange={onChange} disabled={disabled} className="w-full" />
        <label htmlFor={id}>{label}</label>
    </span>
);

const DEFAULT_PROMPT = 'Explain the theme in detail and give listening comprehension questions.';

export default function Listening() {
    const dispatch = useDispatch();
    const toastRef = useRef(null);

    const { user } = useSelector((state) => state.auth);
    const { listenings, error } = useSelector((state) => state.listening);

    const [newListening, setNewListening] = useState({ theme: '' });
    const inputRefs = useRef({});

    useEffect(() => {
        if (!user?.id) {
            dispatch(fetchAuthUser())
                .unwrap()
                .then((res) => dispatch(fetchListenings(res.id)));
        } else {
            dispatch(fetchListenings(user.id));
        }
    }, [dispatch, user]);

    const handleAddListening = () => {
        if (!newListening.theme.trim()) {
            toastRef.current?.show({ severity: 'warn', summary: 'Validation', detail: 'Theme is required' });
            return;
        }

        dispatch(saveListening({ userId: user.id, listening: newListening }))
            .unwrap()
            .then((savedListening) => {
                if (savedListening?.id) {
                    return dispatch(
                        saveListeningPrompt({
                            listeningId: savedListening.id,
                            prompt: DEFAULT_PROMPT,
                            userId: user.id
                        })
                    ).unwrap();
                } else {
                    throw new Error('No listening ID returned');
                }
            })
            .then(() => {
                dispatch(fetchListenings(user.id));
                setNewListening({ theme: '' });
            })
            .catch((err) => {
                console.error(err);
                toastRef.current?.show({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to add listening or prompt' });
            });
    };

    const handleAddPrompt = (listeningId, redirect = false) => {
        const inputRef = inputRefs.current[listeningId];
        const text = inputRef?.value?.trim();
        if (!text) return;

        dispatch(saveListeningPrompt({ listeningId, prompt: text, userId: user.id }))
            .unwrap()
            .then(() => {
                if (inputRef) inputRef.value = '';
                if (redirect) {
                    redirectToPerplexity(listeningId, text);
                }
                dispatch(fetchListenings(user.id));
            })
            .catch(() =>
                toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to add prompt' })
            );
    };

    const handleDeletePrompt = (promptId) => {
        confirmDialog({
            message: 'Delete this prompt?',
            acceptClassName: 'p-button-danger',
            accept: () => dispatch(deleteListeningPrompt({ promptId, userId: user.id })).then(() => dispatch(fetchListenings(user.id)))
        });
    };

    const handleDeleteListening = (listening) => {
        confirmDialog({
            message: `Delete listening "${listening.theme}" and all its prompts?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: () => dispatch(deleteListening({ listeningId: listening.id, userId: user.id })).then(() => dispatch(fetchListenings(user.id)))
        });
    };

    const redirectToPerplexity = (listeningId, prompt) => {
        const theme = listenings.find((l) => l.id === listeningId)?.theme || '';
        window.open(
            `https://www.perplexity.ai/?q=${encodeURIComponent('Accordingly to this theme: ' + theme + ' generate prompt ' + prompt)}`,
            '_blank'
        );
    };

    const promptsBody = (rowData) => {
        const prompts = Array.isArray(rowData.listening_prompts) ? rowData.listening_prompts : [];

        return (
            <div className="space-y-1">
                {prompts.length === 0 && (
                    <div className="text-sm text-gray-500 italic">No prompts yet</div>
                )}
                {prompts.map((p) => {
                    const shortCaption = p.prompt.length > 20 ? p.prompt.slice(0, 50) + '...' : p.prompt;

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
                                icon="pi pi-external-link"
                                className="p-button-info p-button-sm"
                                onClick={() => redirectToPerplexity(rowData.id, p.prompt)}
                            />
                            <Button
                                icon="pi pi-trash"
                                className="p-button-danger p-button-sm"
                                onClick={() => handleDeletePrompt(p.id)}
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
                id="newTheme"
                label="Listening Theme"
                value={newListening.theme}
                onChange={(e) => setNewListening({ theme: e.target.value })}
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
                label="Add Theme"
                icon="pi pi-plus"
                onClick={handleAddListening}
                disabled={!newListening.theme.trim()}
                className="p-button-success"
            />
        </div>
    );

    return (
        <div className="p-4">
            <Toast ref={toastRef} />
            <ConfirmDialog />
            <h2 className="text-xl font-semibold mb-4">🎧 Listening Practice</h2>
            <DataTable
                value={listenings}
                dataKey="id"
                emptyMessage="No listenings found"
                className="shadow-lg"
                paginator={listenings?.length > 10}
                rows={10}
                rowsPerPageOptions={[10, 25, 50]}
                header={header}
                onContextMenu={(e) => handleDeleteListening(e.data)}
            >
                <Column field="theme" header="Theme" className="font-semibold" style={{ width: '30%' }} />
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
