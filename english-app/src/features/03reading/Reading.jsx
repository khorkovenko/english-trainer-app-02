// src/features/reading/Reading.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { fetchReadingItems, saveReadingItem, deleteReadingItem } from './readingSlice';
import { fetchAuthUser } from '../loginModal/authSlice';

const Reading = () => {
    const dispatch = useDispatch();
    const { user, status: authStatus } = useSelector(state => state.auth);
    const { items, loading } = useSelector(state => state.reading);

    const [theme, setTheme] = useState('');
    const [prompt, setPrompt] = useState('');

    // Fetch user on mount
    useEffect(() => {
        if (authStatus === 'idle') {
            dispatch(fetchAuthUser());
        }
    }, [dispatch, authStatus]);

    // Fetch reading items once user is loaded
    useEffect(() => {
        if (user?.id) {
            dispatch(fetchReadingItems(user.id));
        }
    }, [dispatch, user]);

    const handleAdd = () => {
        if (!theme.trim() || !prompt.trim() || !user) return;
        dispatch(saveReadingItem({
            userId: user.id,
            item: { theme, prompt }
        }));
        setTheme('');
        setPrompt('');
    };

    const handleDelete = (id) => {
        if (!user) return;
        dispatch(deleteReadingItem({ userId: user.id, itemId: id }));
    };

    const actionBodyTemplate = (rowData) => {
        const perplexityUrl = `https://www.perplexity.ai/search?q=${encodeURIComponent(`${rowData.theme} ${rowData.prompt}`)}`;
        return (
            <div className="flex gap-2">
                <Button label="Go" icon="pi pi-external-link" className="p-button-sm p-button-success"
                        onClick={() => window.open(perplexityUrl, '_blank')} />
                <Button icon="pi pi-trash" className="p-button-sm p-button-danger"
                        onClick={() => handleDelete(rowData.id)} />
            </div>
        );
    };

    if (authStatus === 'loading') {
        return <p className="p-4">Loading user...</p>;
    }

    if (!user) {
        return <p className="p-4">Please log in to use the Reading Trainer.</p>;
    }

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-xl font-semibold">📖 Reading Trainer</h2>

            <div className="flex flex-col sm:flex-row gap-2">
                <InputText value={theme} onChange={e => setTheme(e.target.value)} placeholder="Theme" />
                <InputText value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Prompt" />
                <Button label="Add" icon="pi pi-plus" onClick={handleAdd} />
            </div>

            <DataTable value={items} loading={loading} responsiveLayout="scroll">
                <Column field="theme" header="Theme" />
                <Column body={actionBodyTemplate} header="Actions" />
            </DataTable>
        </div>
    );
};

export default Reading;
