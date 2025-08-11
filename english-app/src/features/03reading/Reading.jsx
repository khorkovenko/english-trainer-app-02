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
} from './readingSlice';

const Reading = () => {
    const dispatch = useDispatch();
    const toast = useRef(null);
    const { user } = useSelector((state) => state.auth);
    const { readings, loading, error } = useSelector((state) => state.reading);

    const [newReading, setNewReading] = useState({ theme: '' });

    // Use refs for input values instead of controlled state
    const inputRefs = useRef({});

    // Load readings when user changes or on mount
    useEffect(() => {
        if (!user?.id) {
            dispatch(fetchAuthUser())
                .unwrap()
                .then((res) => {
                    dispatch(fetchReadings(res.id));
                })
                .catch((err) => {
                    console.error('Auth error:', err);
                });
        } else {
            dispatch(fetchReadings(user.id));
        }
    }, [dispatch, user]);

    const handleAddReading = () => {
        if (!newReading.theme.trim()) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Validation',
                detail: 'Theme is required',
            });
            return;
        }
        dispatch(saveReading({ userId: user.id, reading: newReading }));
        setNewReading({ theme: '' });
    };

    const handleAddPrompt = (readingId) => {
        const inputRef = inputRefs.current[readingId];
        const text = inputRef?.value?.trim();

        if (!text) return;

        dispatch(saveReadingPrompt({ readingId, prompt: text, userId: user.id }))
            .unwrap()
            .then(() => {
                // Clear input after successful addition
                if (inputRef) {
                    inputRef.value = '';
                }

                // Redirect to Perplexity with the prompt
                const perplexityUrl = `https://www.perplexity.ai/?q=${encodeURIComponent(text)}`;
                window.open(perplexityUrl, '_blank');
            })
            .catch((err) => {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to add prompt',
                });
            });
    };

    const handleDeletePrompt = (promptId) => {
        confirmDialog({
            message: 'Delete this prompt?',
            acceptClassName: 'p-button-danger',
            accept: () => dispatch(deleteReadingPrompt({ promptId, userId: user.id })),
        });
    };

    const redirectToPerplexity = (prompt) => {
        const perplexityUrl = `https://www.perplexity.ai/?q=${encodeURIComponent(prompt)}`;
        window.open(perplexityUrl, '_blank');
    };

    const promptsBody = (rowData) => {
        const prompts = Array.isArray(rowData.reading_prompts) ? rowData.reading_prompts : [];

        return (
            <div>
                {prompts.length === 0 && (
                    <div className="text-sm text-gray-500 mb-1">No prompts yet</div>
                )}
                {prompts.map((p) => (
                    <div
                        key={p.id}
                        className="flex justify-between items-center border-b py-1 mb-1"
                    >
                        <span
                            className="cursor-pointer text-blue-600 hover:text-blue-800 flex-1 mr-2"
                            onClick={() => redirectToPerplexity(p.prompt)}
                            title="Click to search on Perplexity"
                        >
                            {p.prompt}
                        </span>
                        <div className="flex gap-1">
                            <Button
                                icon="pi pi-external-link"
                                className="p-button-info p-button-sm"
                                onClick={() => redirectToPerplexity(p.prompt)}
                                tooltip="Open in Perplexity"
                                tooltipOptions={{ position: 'top' }}
                            />
                            <Button
                                icon="pi pi-trash"
                                className="p-button-danger p-button-sm"
                                onClick={() => handleDeletePrompt(p.id)}
                                tooltip="Delete prompt"
                                tooltipOptions={{ position: 'top' }}
                            />
                        </div>
                    </div>
                ))}
                <div className="flex mt-2 gap-2">
                    <InputText
                        ref={(el) => {
                            if (el) inputRefs.current[rowData.id] = el;
                        }}
                        type="text"
                        placeholder="Enter new prompt"
                        className="flex-1 p-2 border border-gray-300 rounded"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddPrompt(rowData.id);
                            }
                        }}
                    />
                    <Button
                        label="Add & Search"
                        icon="pi pi-plus"
                        onClick={() => handleAddPrompt(rowData.id)}
                        className="p-button-success"
                        tooltip="Add prompt and search on Perplexity"
                        tooltipOptions={{ position: 'top' }}
                    />
                </div>
            </div>
        );
    };

    const onKeyDownNewReading = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddReading();
        }
    };

    return (
        <div className="p-4">
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">📖 Reading Practice</h2>
                <div className="flex gap-2 mb-4">
                    <InputText
                        placeholder="Enter reading theme..."
                        value={newReading.theme}
                        onChange={(e) => setNewReading({ theme: e.target.value })}
                        autoComplete="off"
                        className="flex-1"
                        onKeyDown={onKeyDownNewReading}
                    />
                    <Button
                        label="Add Reading"
                        icon="pi pi-plus"
                        onClick={handleAddReading}
                        disabled={!newReading.theme.trim()}
                        className="p-button-primary"
                    />
                </div>
            </div>

            <DataTable
                value={readings}
                dataKey="id"
                loading={loading}
                emptyMessage="No readings found"
                className="shadow-lg"
                paginator={readings?.length > 10}
                rows={10}
                rowsPerPageOptions={[10, 25, 50]}
            >
                <Column
                    field="theme"
                    header="Theme"
                    className="font-semibold"
                    style={{ width: '30%' }}
                />
                <Column
                    header="Prompts & Search"
                    body={promptsBody}
                    style={{ width: '70%' }}
                />
            </DataTable>

            {error && (
                <div className="mt-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
                    <strong>Error:</strong> {error}
                </div>
            )}
        </div>
    );
};

export default Reading;