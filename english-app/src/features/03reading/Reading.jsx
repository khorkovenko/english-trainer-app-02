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
    fetchReadings,
    saveReading,
    saveReadingPrompt,
    deleteReadingPrompt,
    deleteReading
} from './readingSlice';

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

const DEFAULT_PROMPT = 'Explain the theme in detail and give reading comprehension questions.';

export default function Reading() {
    const dispatch = useDispatch();
    const toastRef = useRef(null);

    const { user } = useSelector((state) => state.auth);
    const { readings, error } = useSelector((state) => state.reading);

    const [newReading, setNewReading] = useState({ theme: '' });
    const inputRefs = useRef({});

    useEffect(() => {
        if (!user?.id) {
            dispatch(fetchAuthUser())
                .unwrap()
                .then((res) => dispatch(fetchReadings(res.id)));
        } else {
            dispatch(fetchReadings(user.id));
        }
    }, [dispatch, user]);

    const handleAddReading = () => {
        if (!newReading.theme.trim()) {
            toastRef.current?.show({ severity: 'warn', summary: 'Validation', detail: 'Theme is required' });
            return;
        }

        dispatch(saveReading({ userId: user.id, reading: newReading }))
            .unwrap()
            .then((savedReading) => {
                if (savedReading?.id) {
                    return dispatch(
                        saveReadingPrompt({
                            readingId: savedReading.id,
                            prompt: DEFAULT_PROMPT,
                            userId: user.id
                        })
                    ).unwrap();
                } else {
                    throw new Error('No reading ID returned');
                }
            })
            .then(() => {
                dispatch(fetchReadings(user.id));
                setNewReading({ theme: '' });
            })
            .catch((err) => {
                console.error(err);
                toastRef.current?.show({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to add reading or prompt' });
            });
    };

    const handleAddPrompt = (readingId, redirect = false) => {
        const inputRef = inputRefs.current[readingId];
        const text = inputRef?.value?.trim();
        if (!text) return;

        dispatch(saveReadingPrompt({ readingId, prompt: text, userId: user.id }))
            .unwrap()
            .then(() => {
                if (inputRef) inputRef.value = '';
                if (redirect) {
                    redirectToPerplexity(readingId, text);
                }
                dispatch(fetchReadings(user.id));
            })
            .catch(() =>
                toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to add prompt' })
            );
    };

    const handleDeletePrompt = (promptId) => {
        confirmDialog({
            message: 'Delete this prompt?',
            acceptClassName: 'p-button-danger',
            accept: () => dispatch(deleteReadingPrompt({ promptId, userId: user.id })).then(() => dispatch(fetchReadings(user.id)))
        });
    };

    const handleDeleteReading = (reading) => {
        confirmDialog({
            message: `Delete reading "${reading.theme}" and all its prompts?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: () => dispatch(deleteReading({ readingId: reading.id, userId: user.id })).then(() => dispatch(fetchReadings(user.id)))
        });
    };

    const redirectToPerplexity = (readingId, prompt) => {
        const theme = readings.find((r) => r.id === readingId)?.theme || '';
        window.open(
            `https://www.perplexity.ai/?q=${encodeURIComponent(theme + ' generate for ' + prompt)}`,
            '_blank'
        );
    };

    const promptsBody = (rowData) => {
        const prompts = Array.isArray(rowData.reading_prompts) ? rowData.reading_prompts : [];
        return (
            <div className="space-y-1">
                {prompts.length === 0 && (
                    <div className="text-sm text-gray-500 italic">No prompts yet</div>
                )}
                {prompts.map((p) => (
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
                            className="cursor-pointer text-blue-600 hover:text-blue-800 truncate flex-1"
                            style={{ margin: '0 15px' }}
                            onClick={() => redirectToPerplexity(rowData.id, p.prompt)}
                        >
                            {p.prompt}
                        </span>
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
                ))}
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
                label="Reading Theme"
                value={newReading.theme}
                onChange={(e) => setNewReading({ theme: e.target.value })}
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
                onClick={handleAddReading}
                disabled={!newReading.theme.trim()}
                className="p-button-success"
            />
        </div>
    );

    return (
        <div className="p-4">
            <Toast ref={toastRef} />
            <ConfirmDialog />
            <h2 className="text-xl font-semibold mb-4">📖 Reading Practice</h2>
            <DataTable
                value={readings}
                dataKey="id"
                emptyMessage="No readings found"
                className="shadow-lg"
                paginator={readings?.length > 10}
                rows={10}
                rowsPerPageOptions={[10, 25, 50]}
                header={header}
                onContextMenu={(e) => handleDeleteReading(e.data)}
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
