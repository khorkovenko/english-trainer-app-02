import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { ContextMenu } from 'primereact/contextmenu';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Button } from 'primereact/button';
import { Image } from 'primereact/image';
import TypingTrainerModal from './TypingTrainerModal';
import {
    fetchAuthUser,
    fetchWordsByUserId,
    saveWord,
    deleteWordById,
    deleteAllWords,
} from './vocabSlice';
import FloatingInput from "../../components/FloatingInput";

const isValidUrl = (str) => {
    try {
        const url = new URL(str);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

const Vocabulary = () => {
    const dispatch = useDispatch();
    const toast = useRef(null);
    const contextMenu = useRef(null);
    const { user, words = [], loading, error } = useSelector((state) => state.vocab || {});
    const [filters, setFilters] = useState({ global: { value: null, matchMode: 'contains' } });
    const [selectedWord, setSelectedWord] = useState(null);
    const [userLoaded, setUserLoaded] = useState(false);
    const [initialLoadDone, setInitialLoadDone] = useState(false);
    const [newWordData, setNewWordData] = useState(() => {
        const saved = localStorage.getItem('newWordData');
        return saved ? JSON.parse(saved) : { word: '', explanation: '', association: '' };
    });
    const [showModal, setShowModal] = useState(false);
    const [modalWord, setModalWord] = useState(null);

    useEffect(() => localStorage.setItem('newWordData', JSON.stringify(newWordData)), [newWordData]);

    useEffect(() => {
        if (error) toast.current.show({ severity: 'error', summary: 'Error', detail: error, life: 5000 });
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
        if (userLoaded && user?.id) dispatch(fetchWordsByUserId(user.id));
    }, [dispatch, userLoaded, user]);

    const onRowEditComplete = (e) => {
        if (!user?.id) return;
        dispatch(saveWord({ userId: user.id, wordObj: e.newData }));
    };

    const textEditor = (options) => <InputText type="text" value={options.value} onChange={(e) => options.editorCallback(e.target.value)} />;

    const confirmDelete = (word) => {
        confirmDialog({
            message: `Delete word "${word.word}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: () => {
                if (user?.id && word?.id) dispatch(deleteWordById({ userId: user.id, wordId: word.id }));
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
                if (user?.id) dispatch(deleteAllWords(user.id));
            },
        });
    };

    const showHelp = () => {
        const word = newWordData.word.trim();
        if (word) {
            const prompt = encodeURIComponent(
                `Explain the word "${word}" in clear and simple terms.
                              Provide its meaning, part of speech, and common synonyms.
                              Give at least 2 real-world example sentences.
                              Then, create a short, natural-sounding dialogue (4–6 lines) that shows how to use "${word}" in everyday conversation.
                              Make the tone friendly and easy to understand for a language learner.`
            );
            const url = `https://chat.openai.com/?prompt=${prompt}`;
            window.open(url, '_blank');
        } else {
            toast.current.show({
                severity: 'error',
                summary: 'Empty word!',
                detail: 'Enter word and AI will help to explain it.',
                life: 7000,
            });
        }
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
        setFilters({ global: { value: null, matchMode: 'contains' } });
        setNewWordData({ word: '', explanation: '', association: '' });
        localStorage.removeItem('newWordData');
    };

    const onReloadWords = () => {
        if (user?.id) dispatch(fetchWordsByUserId(user.id));
    };

    const associationBodyTemplate = (rowData) => {
        if (isValidUrl(rowData.association)) {
            return (
                <div className="association-image-wrapper">
                    <Image
                        src={rowData.association}
                        alt={rowData.word}
                        width="60"
                        preview
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.outerHTML = `<span style="color:red;font-size:0.9rem;">Image not found</span>`;
                        }}
                    />
                </div>
            );
        }
        return rowData.association;
    };

    function isClickInsideAssociationImage(target) {
        if (!target) return false;
        let el = target;
        for (let i = 0; i < 10 && el; i++) {
            if (el.classList && el.classList.contains('association-image-wrapper')) return true;
            el = el.parentElement;
        }
        return false;
    }

    function isImagePreviewOpen() {
        return !!document.querySelector('.p-image-mask.p-component-overlay');
    }

    const header = (
        <div className="p-d-flex p-ai-center p-flex-wrap" style={{ gap: '0.5rem', flex: '1 1 600px', minWidth: '300px' }}>
            <FloatingInput id="globalSearch" label="Search words" value={filters.global?.value || ''} onChange={(e) => setFilters({ global: { value: e.target.value, matchMode: 'contains' } })} disabled={!userLoaded} style={{ flex: '1 1 140px', minWidth: '140px' }} />
            <span style={{ color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '1.5rem', margin: '0 12px', userSelect: 'none', flexShrink: 0 }}>||</span>
            <FloatingInput id="newWord" label="Word" value={newWordData.word} onChange={(e) => setNewWordData({ ...newWordData, word: e.target.value })} disabled={!userLoaded} style={{ flex: '1 1 140px', minWidth: '140px' }} />
            <FloatingInput id="newExplanation" label="Explanation" value={newWordData.explanation} onChange={(e) => setNewWordData({ ...newWordData, explanation: e.target.value })} disabled={!userLoaded} style={{ flex: '1 1 160px', minWidth: '160px' }} />
            <FloatingInput id="newAssociation" label="Association" value={newWordData.association} onChange={(e) => setNewWordData({ ...newWordData, association: e.target.value })} disabled={!userLoaded} style={{ flex: '1 1 140px', minWidth: '140px' }} />
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
                if (selectedWord) confirmDelete(selectedWord);
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
                    if (isImagePreviewOpen()) return;
                    if (isClickInsideAssociationImage(e.originalEvent.target)) return;
                    setModalWord(e.data);
                    setShowModal(true);
                }}
                onContextMenu={(e) => {
                    const word = e.data;
                    if (word) {
                        confirmDialog({
                            message: `Delete word "${word.word}"?`,
                            header: 'Confirm Delete',
                            icon: 'pi pi-exclamation-triangle',
                            acceptClassName: 'p-button-danger',
                            accept: () => {
                                if (user?.id && word.id) {
                                    dispatch(deleteWordById({ userId: user.id, wordId: word.id }));
                                }
                            }
                        });
                    }
                }}
            >
                <Column field="word" header="Word" editor={textEditor} sortable />
                <Column field="explanation" header="Explanation" editor={textEditor} sortable />
                <Column field="association" header="Association" body={associationBodyTemplate} editor={textEditor} sortable />
                <Column rowEditor headerStyle={{ width: '10%', minWidth: '8rem' }} bodyStyle={{ textAlign: 'center' }} />
            </DataTable>
            <ContextMenu model={cmItems} ref={contextMenu} />
            <TypingTrainerModal wordData={modalWord} visible={showModal} onClose={() => setShowModal(false)} />
        </div>
    );
};

export default Vocabulary;
