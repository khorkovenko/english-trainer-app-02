import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ContextMenu } from 'primereact/contextmenu';
import { fetchAuthUser } from '../loginModal/authSlice';
import {
    fetchReadings,
    saveReading,
    saveReadingPrompt,
    deleteReadingPrompt,
    deleteReading,
} from './readingSlice';

const FloatingInput = ({ id, label, value, onChange, disabled }) => (
    <span className="p-float-label" style={{ flex: '1 1 200px', minWidth: '200px' }}>
        <InputText id={id} value={value} onChange={onChange} disabled={disabled} className="w-full" />
        <label htmlFor={id}>{label}</label>
    </span>
);

const Reading = () => {
    const dispatch = useDispatch();
    const toast = useRef(null);
    const contextMenu = useRef(null);
    const { user } = useSelector((state) => state.auth);
    const { readings, error } = useSelector((state) => state.reading);

    const [newReading, setNewReading] = useState({ theme: '' });
    const [selectedReading, setSelectedReading] = useState(null);
    const inputRefs = useRef({});

    useEffect(() => {
        if (!user?.id) {
            dispatch(fetchAuthUser())
                .unwrap()
                .then((res) => dispatch(fetchReadings(res.id)))
                .catch((err) => console.error('Auth error:', err));
        } else {
            dispatch(fetchReadings(user.id));
        }
    }, [dispatch, user]);

    const handleAddReading = () => {
        if (!newReading.theme.trim()) {
            toast.current?.show({ severity: 'warn', summary: 'Validation', detail: 'Theme is required' });
            return;
        }
        dispatch(saveReading({ userId: user.id, reading: newReading }));
        setNewReading({ theme: '' });
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
                    window.open(`https://www.perplexity.ai/?q=${encodeURIComponent(text)}`, '_blank');
                }
            })
            .catch(() =>
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to add prompt' })
            );
    };

    const handleDeletePrompt = (promptId) => {
        confirmDialog({
            message: 'Delete this prompt?',
            acceptClassName: 'p-button-danger',
            accept: () => dispatch(deleteReadingPrompt({ promptId, userId: user.id })),
        });
    };

    const handleDeleteReading = (reading) => {
        confirmDialog({
            message: `Delete reading "${reading.theme}" and all its prompts?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: () => dispatch(deleteReading({ readingId: reading.id, userId: user.id })),
        });
    };

    const redirectToPerplexity = (prompt) => {
        window.open(`https://www.perplexity.ai/?q=${encodeURIComponent(prompt)}`, '_blank');
    };

    const promptsBody = (rowData) => {
        const prompts = Array.isArray(rowData.reading_prompts) ? rowData.reading_prompts : [];
        return (
            <div className="space-y-1">
                {prompts.length === 0 && <div className="text-sm text-gray-500 italic">No prompts yet</div>}
                {prompts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded">
                        <span
                            className="cursor-pointer text-blue-600 hover:text-blue-800 truncate mr-2 flex-1"
                            onClick={() => redirectToPerplexity(p.prompt)}
                            title="Click to search on Perplexity"
                        >
                            {p.prompt}
                        </span>
                        <div className="flex gap-1 items-center">
                            <Button
                                icon="pi pi-external-link"
                                className="p-button-info p-button-sm"
                                onClick={() => redirectToPerplexity(p.prompt)}
                                tooltip="Open in Perplexity"
                            />
                            <Button
                                icon="pi pi-trash"
                                className="p-button-danger p-button-sm"
                                onClick={() => handleDeletePrompt(p.id)}
                                tooltip="Delete prompt"
                            />
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const promptInputBody = (rowData) => (
        <div className="flex gap-2 items-center">
            <InputText
                ref={(el) => el && (inputRefs.current[rowData.id] = el)}
                type="text"
                placeholder="Enter new prompt"
                className="flex-1"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPrompt(rowData.id, false); // no redirect on Enter either
                    }
                }}
            />
            <Button
                icon="pi pi-plus"
                label="Add"
                className="p-button-success p-button-sm"
                onClick={() => handleAddPrompt(rowData.id, false)} // no redirect on Add button
            />
        </div>
    );

    const header = (
        <div className="flex flex-wrap items-end gap-3">
            <FloatingInput
                id="newTheme"
                label="Reading Theme"
                value={newReading.theme}
                onChange={(e) => setNewReading({ theme: e.target.value })}
            />
            <Button
                label="Add Reading"
                icon="pi pi-plus"
                onClick={handleAddReading}
                disabled={!newReading.theme.trim()}
                className="p-button-primary"
                style={{ flex: '0 0 auto' }}
            />
        </div>
    );

    const cmItems = [
        {
            label: 'Delete Reading',
            icon: 'pi pi-trash',
            command: () => selectedReading && handleDeleteReading(selectedReading),
        },
    ];

    return (
        <div className="p-4">
            <Toast ref={toast} />
            <ConfirmDialog />
            <ContextMenu model={cmItems} ref={contextMenu} />

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
                selectionMode="single"
                contextMenuSelection={selectedReading}
                onContextMenuSelectionChange={(e) => setSelectedReading(e.value)}
                onContextMenu={(e) => contextMenu.current.show(e.originalEvent)}
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
};

export default Reading;
