import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { ContextMenu } from 'primereact/contextmenu';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Button } from 'primereact/button';
import WordModal from './WordModal';

import {
    fetchAuthUser,
    fetchWordsByUserId,
    saveWord,
    deleteWordById,
    deleteAllWords,
} from './vocabSlice';

// Move FloatingInput outside Vocabulary to avoid redefining on every render
const FloatingInput = ({ id, label, value, onChange, disabled }) => (
    <span
        className="p-float-label"
        style={{ flex: '1 1 160px', minWidth: '160px', display: 'inline-flex', flexDirection: 'column' }}
    >
        <InputText
            id={id}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="w-full"
        />
        <label htmlFor={id}>{label}</label>
    </span>
);

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
    const [showModal, setShowModal] = useState(false);
    const [modalWord, setModalWord] = useState(null);

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

    const confirmFlushAll = () => {
        confirmDialog({
            message: 'Are you sure you want to delete all words?',
            header: 'Confirm Flush',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: () => {
                if (user?.id) {
                    dispatch(deleteAllWords(user.id));
                }
            },
        });
    };

    const showHelp = () => {
        toast.current.show({
            severity: 'info',
            summary: 'Help',
            detail: 'You can add, edit, and delete vocabulary. Right-click a row for context options.',
            life: 7000,
        });
    };

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
        <div className="p-d-flex p-flex-wrap p-ai-center" style={{ gap: '0.5rem', marginTop: '.75rem'  }}>
            <FloatingInput
                id="globalSearch"
                label="Search words"
                value={filters.global?.value || ''}
                onChange={e => setFilters({ global: { value: e.target.value, matchMode: 'contains' } })}
                disabled={false}
            />
            <FloatingInput
                id="newWord"
                label="Word"
                value={newWordData.word}
                onChange={e => setNewWordData(prev => ({ ...prev, word: e.target.value }))}
                disabled={!userLoaded}
            />
            <FloatingInput
                id="newExplanation"
                label="Explanation"
                value={newWordData.explanation}
                onChange={e => setNewWordData(prev => ({ ...prev, explanation: e.target.value }))}
                disabled={!userLoaded}
            />
            <FloatingInput
                id="newAssociation"
                label="Association"
                value={newWordData.association}
                onChange={e => setNewWordData(prev => ({ ...prev, association: e.target.value }))}
                disabled={!userLoaded}
            />
            <Button label="Add" icon="pi pi-plus" onClick={onAddNewWord} disabled={!userLoaded} className="p-button-success" style={{ flex: '0 0 auto' }} />
            <Button label="Clear" icon="pi pi-times" onClick={onClearNewWord} disabled={!userLoaded} className="p-button-secondary" style={{ flex: '0 0 auto' }} />
            <Button label="Reload" icon="pi pi-refresh" onClick={onReloadWords} disabled={!userLoaded} className="p-button-info" style={{ flex: '0 0 auto' }} />
            <Button label="Help" icon="pi pi-question-circle" onClick={showHelp} className="p-button-help" style={{ flex: '0 0 auto' }} />
            <Button label="Flush" icon="pi pi-trash" onClick={confirmFlushAll} disabled={!userLoaded} className="p-button-danger" style={{ flex: '0 0 auto' }} />
        </div>
    );

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
                globalFilterFields={['word', 'explanation', 'association']}
                editMode="row"
                onRowEditComplete={onRowEditComplete}
                tableStyle={{ minWidth: '50rem' }}
                emptyMessage="No words found."
                selectionMode={null}
                onRowClick={(e) => {
                    setModalWord(e.data);
                    setShowModal(true);
                }}
                onContextMenu={(e) => {
                    const word = e.data;
                    if (word && window.confirm(`Delete word "${word.word}"?`)) {
                        if (user?.id && word.id) {
                            dispatch(deleteWordById({ userId: user.id, wordId: word.id }));
                        }
                    }
                }}
            >

            <Column field="word" header="Word" editor={textEditor} sortable />
                <Column field="explanation" header="Explanation" editor={textEditor} sortable />
                <Column field="association" header="Association" editor={textEditor} sortable />
                <Column
                    rowEditor
                    headerStyle={{ width: '10%', minWidth: '8rem' }}
                    bodyStyle={{ textAlign: 'center' }}
                />
            </DataTable>


            <ContextMenu model={cmItems} ref={contextMenu} />

            <WordModal
                wordData={modalWord}
                visible={showModal}
                onClose={() => setShowModal(false)}
            />

        </div>
    );
};

export default Vocabulary;
