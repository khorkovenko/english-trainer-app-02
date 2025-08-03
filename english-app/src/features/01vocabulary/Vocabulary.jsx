import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { ContextMenu } from 'primereact/contextmenu';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Button } from 'primereact/button';

import {
    fetchAuthUser,
    fetchWordsByUserId,
    saveWord,
    deleteWordById,
} from './vocabSlice';

const Vocabulary = () => {
    const dispatch = useDispatch();
    const toast = useRef(null);
    const contextMenu = useRef(null);

    const { user, words, loading, error } = useSelector((state) => state.vocab || {});

    const [filters, setFilters] = useState({ global: { value: null, matchMode: 'contains' } });
    const [selectedWord, setSelectedWord] = useState(null);
    const [userLoaded, setUserLoaded] = useState(false);
    const [initialLoadDone, setInitialLoadDone] = useState(false);
    const [newWordData, setNewWordData] = useState({ word: '', explanation: '', association: '' });

    useEffect(() => {
        if (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: error, life: 5000 });
        }
    }, [error]);

    useEffect(() => {
        if (!initialLoadDone) {
            dispatch(fetchAuthUser())
                .unwrap()
                .then(() => setUserLoaded(true))
                .catch(() => setUserLoaded(false))
                .finally(() => setInitialLoadDone(true));
        }
    }, [dispatch, initialLoadDone]);

    useEffect(() => {
        if (userLoaded && user?.id) {
            dispatch(fetchWordsByUserId(user.id));
        }
    }, [dispatch, userLoaded, user]);

    const onRowEditComplete = (e) => {
        if (!user?.id) return;
        const { newData } = e;
        dispatch(saveWord({ userId: user.id, wordObj: newData }));
    };

    const textEditor = (options) => (
        <InputText
            type="text"
            value={options.value}
            onChange={(e) => options.editorCallback(e.target.value)}
        />
    );

    const confirmDelete = (word) => {
        confirmDialog({
            message: `Delete word "${word.word}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: () => {
                if (user?.id && word?.id) {
                    dispatch(deleteWordById({ userId: user.id, wordId: word.id }));
                }
            },
        });
    };

    const cmItems = [
        {
            label: 'Delete',
            icon: 'pi pi-trash',
            command: () => {
                if (selectedWord) {
                    confirmDelete(selectedWord);
                }
            },
        },
    ];

    const onAddNewWord = () => {
        if (!newWordData.word.trim()) {
            toast.current.show({ severity: 'warn', summary: 'Validation', detail: 'Word cannot be empty' });
            return;
        }
        if (!user?.id) {
            toast.current.show({ severity: 'error', summary: 'User not loaded', detail: 'Please wait until user data is loaded.' });
            return;
        }
        dispatch(saveWord({ userId: user.id, wordObj: newWordData }));
        setNewWordData({ word: '', explanation: '', association: '' });
    };

    const onClearNewWord = () => {
        setNewWordData({ word: '', explanation: '', association: '' });
    };

    const onReloadWords = () => {
        if (user?.id) {
            dispatch(fetchWordsByUserId(user.id));
        }
    };

    const header = (
        <div className="flex flex-wrap gap-3 justify-content-between align-items-center">
            <div style={{ flexGrow: 1, minWidth: 200, maxWidth: 300 }}>
                <span className="p-float-label" style={{ width: '100%' }}>
                    <InputText
                        id="globalSearch"
                        type="search"
                        onInput={(e) => setFilters({ global: { value: e.target.value, matchMode: 'contains' } })}
                        placeholder=" "
                        className="p-inputtext-sm"
                        style={{ width: '100%' }}
                    />
                    <label htmlFor="globalSearch">Search words</label>
                </span>
            </div>

            <div className="flex gap-2 flex-wrap" style={{ flexGrow: 2, minWidth: 400, maxWidth: 600 }}>
                <span className="p-float-label" style={{ flexGrow: 1, minWidth: 120 }}>
                    <InputText
                        id="newWord"
                        value={newWordData.word}
                        onChange={(e) => setNewWordData({ ...newWordData, word: e.target.value })}
                        style={{ width: '100%' }}
                        disabled={!userLoaded}
                    />
                    <label htmlFor="newWord">Word</label>
                </span>
                <span className="p-float-label" style={{ flexGrow: 1, minWidth: 150 }}>
                    <InputText
                        id="newExplanation"
                        value={newWordData.explanation}
                        onChange={(e) => setNewWordData({ ...newWordData, explanation: e.target.value })}
                        style={{ width: '100%' }}
                        disabled={!userLoaded}
                    />
                    <label htmlFor="newExplanation">Explanation</label>
                </span>
                <span className="p-float-label" style={{ flexGrow: 1, minWidth: 150 }}>
                    <InputText
                        id="newAssociation"
                        value={newWordData.association}
                        onChange={(e) => setNewWordData({ ...newWordData, association: e.target.value })}
                        style={{ width: '100%' }}
                        disabled={!userLoaded}
                    />
                    <label htmlFor="newAssociation">Association</label>
                </span>

                <Button
                    label="Add Word"
                    icon="pi pi-plus"
                    onClick={onAddNewWord}
                    disabled={!userLoaded}
                    className="p-button-success"
                    style={{ height: '2.5rem' }}
                />
                <Button
                    label="Clear"
                    icon="pi pi-times"
                    onClick={onClearNewWord}
                    disabled={!userLoaded}
                    className="p-button-secondary"
                    style={{ height: '2.5rem' }}
                />
                <Button
                    label="Reload Words"
                    icon="pi pi-refresh"
                    onClick={onReloadWords}
                    disabled={!userLoaded}
                    className="p-button-info"
                    style={{ height: '2.5rem' }}
                />
            </div>
        </div>
    );

    return (
        <div className="p-4">
            <Toast ref={toast} />
            <ConfirmDialog />
            <h2 className="text-xl font-semibold mb-4">Vocabulary Practice</h2>

            <DataTable
                value={words}
                dataKey="id"
                header={header}
                filters={filters}
                filterDisplay="row"
                globalFilterFields={['word', 'explanation', 'association']}
                editMode="row"
                onRowEditComplete={onRowEditComplete}
                contextMenuSelection={selectedWord}
                onContextMenuSelectionChange={(e) => setSelectedWord(e.value)}
                onContextMenu={(e) => {
                    setSelectedWord(e.data);
                    contextMenu.current.show(e.originalEvent);
                    e.originalEvent.preventDefault();
                }}
                tableStyle={{ minWidth: '50rem' }}
                emptyMessage="No words found."
            >
                <Column field="word" header="Word" editor={textEditor} sortable filter filterPlaceholder="Filter by word" />
                <Column field="explanation" header="Explanation" editor={textEditor} sortable filter filterPlaceholder="Filter by explanation" />
                <Column field="association" header="Association" editor={textEditor} sortable filter filterPlaceholder="Filter by association" />
                <Column rowEditor headerStyle={{ width: '10%', minWidth: '8rem' }} bodyStyle={{ textAlign: 'center' }} />
            </DataTable>

            <ContextMenu model={cmItems} ref={contextMenu} />
        </div>
    );
};

export default Vocabulary;
