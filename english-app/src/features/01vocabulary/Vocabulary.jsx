import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Sidebar } from 'primereact/sidebar';
import { Toast } from 'primereact/toast';
import { ContextMenu } from 'primereact/contextmenu';
import {supabaseClient} from '../../supabaseClient';


import {
    fetchUserByEmail,
    fetchWordsByUserId,
    saveWord,
    deleteWordById,
    flushAllData
} from './vocabSlice';

const USER_EMAIL = 'horkovenko.k@gmail.com';

const Vocabulary = () => {
    const dispatch = useDispatch();
    const toast = useRef(null);
    const contextMenu = useRef(null);

    const { user, words, loading, error } = useSelector((state) => state.vocab);

    const [filters, setFilters] = useState({ global: { value: null, matchMode: 'contains' } });
    const [selectedWord, setSelectedWord] = useState(null);
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [editData, setEditData] = useState({ word: '', explanation: '', association: '', id: null });
    const [userLoaded, setUserLoaded] = useState(false);

    // Fetch user on mount
    useEffect(() => {
        dispatch(fetchUserByEmail(USER_EMAIL))
            .unwrap()
            .then(() => setUserLoaded(true))
            .catch(() => setUserLoaded(false));
    }, [dispatch]);

    // Fetch words after user loads
    useEffect(() => {
        if (userLoaded && user?.id) {
            dispatch(fetchWordsByUserId(user.id));
        }
    }, [dispatch, userLoaded, user]);

    // Show errors in toast
    useEffect(() => {
        if (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: error, life: 5000 });
        }
    }, [error]);

    // Context menu items
    const cmItems = [
        {
            label: 'Delete',
            icon: 'pi pi-trash',
            command: () => {
                if (selectedWord) {
                    if (window.confirm(`Delete word "${selectedWord.word}"?`)) {
                        dispatch(deleteWordById({ userId: user.id, wordId: selectedWord.id }));
                    }
                }
            }
        }
    ];

    // Save edited or new word
    const onSidebarSave = () => {
        if (!userLoaded || !user?.id) {
            toast.current.show({ severity: 'error', summary: 'User not loaded', detail: 'Please wait until user data is loaded.' });
            return;
        }
        if (!editData.word.trim()) {
            toast.current.show({ severity: 'warn', summary: 'Validation', detail: 'Word cannot be empty' });
            return;
        }
        dispatch(saveWord({ userId: user.id, wordObj: editData }));
        setSidebarVisible(false);
        setEditData({ word: '', explanation: '', association: '', id: null });
    };

    // Open modal to add or edit word
    const openSidebarForEdit = (word = null) => {
        if (!userLoaded) {
            toast.current.show({ severity: 'warn', summary: 'User loading', detail: 'Please wait until user is loaded' });
            return;
        }
        setEditData(word || { word: '', explanation: '', association: '', id: null });
        setSidebarVisible(true);
    };

    // Header filter UI
    const header = (
        <div className="p-input-icon-left" style={{ marginBottom: '1rem' }}>

            <InputText
                type="search"
                onInput={(e) => setFilters({ global: { value: e.target.value, matchMode: 'contains' } })}
                placeholder="Search words..."
                className="p-inputtext-sm"
                style={{ width: '100%' }}
            />
        </div>
    );

    return (
        <div className="p-4">
            <Toast ref={toast} />
            <h2 className="text-xl font-semibold mb-4">Vocabulary Practice</h2>

            <div className="mb-4">
                <Button
                    label="Add New Word"
                    icon="pi pi-plus"
                    className="mr-2"
                    onClick={() => openSidebarForEdit(null)}
                    disabled={!userLoaded}
                />

                <Button
                    label="Flush All Data"
                    icon="pi pi-trash"
                    className="p-button-danger"
                    onClick={() => {
                        if (window.confirm("Delete ALL your vocab words and user data?")) {
                            dispatch(flushAllData());
                        }
                    }}
                    disabled={!userLoaded}
                />
            </div>

            <DataTable
                value={words}
                loading={loading}
                dataKey="id"
                header={header}
                filters={filters}
                filterDisplay="row"
                globalFilterFields={['word', 'explanation', 'association']}
                contextMenuSelection={selectedWord}
                onContextMenuSelectionChange={(e) => setSelectedWord(e.value)}
                onContextMenu={(e) => {
                    setSelectedWord(e.data);
                    contextMenu.current.show(e.originalEvent);
                    e.originalEvent.preventDefault();
                }}
                onRowDoubleClick={(e) => openSidebarForEdit(e.data)}
                // pagination removed per request
            >
                <Column field="word" header="Word" sortable filter filterPlaceholder="Filter by word" />
                <Column field="explanation" header="Explanation" sortable filter filterPlaceholder="Filter by explanation" />
                <Column field="association" header="Association" sortable filter filterPlaceholder="Filter by association" />
            </DataTable>

            <ContextMenu model={cmItems} ref={contextMenu} />

            <Sidebar
                visible={sidebarVisible}
                position="top"
                fullScreen
                onHide={() => setSidebarVisible(false)}
                style={{ padding: '2rem', overflowY: 'auto' }}
            >
                <h2 style={{ marginBottom: '1.5rem' }}>{editData.id ? `Edit Word: ${editData.word}` : 'Add New Word'}</h2>

                <div className="p-fluid p-formgrid p-grid" style={{ gap: '1.5rem' }}>
                    <div className="p-field p-col-12 p-md-4">
                        <label htmlFor="word" style={{ marginBottom: '.5rem', display: 'block' }}>Word</label>
                        <InputText
                            id="word"
                            value={editData.word}
                            onChange={(e) => setEditData({ ...editData, word: e.target.value })}
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div className="p-field p-col-12 p-md-4">
                        <label htmlFor="explanation" style={{ marginBottom: '.5rem', display: 'block' }}>Explanation</label>
                        <InputText
                            id="explanation"
                            value={editData.explanation}
                            onChange={(e) => setEditData({ ...editData, explanation: e.target.value })}
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div className="p-field p-col-12 p-md-4">
                        <label htmlFor="association" style={{ marginBottom: '.5rem', display: 'block' }}>Association</label>
                        <InputText
                            id="association"
                            value={editData.association}
                            onChange={(e) => setEditData({ ...editData, association: e.target.value })}
                            style={{ width: '100%' }}
                        />
                    </div>
                </div>

                <div className="flex justify-content-between mt-6">
                    <Button label="Cancel" className="p-button-text" onClick={() => setSidebarVisible(false)} />
                    <Button label="Save" icon="pi pi-check" onClick={onSidebarSave} />
                </div>
            </Sidebar>
        </div>
    );
};

export default Vocabulary;
