import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { ContextMenu } from 'primereact/contextmenu';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';

import {
    fetchAuthUser,
    fetchWordsByUserId,
    saveWord,
    deleteWordById,
} from './vocabSlice';

const USER_EMAIL = 'horkovenko.k@gmail.com';

const Vocabulary = () => {
    const dispatch = useDispatch();
    const toast = useRef(null);
    const contextMenu = useRef(null);

    const { user, words, loading, error } = useSelector((state) => state.vocab || {});

    const [filters, setFilters] = useState({ global: { value: null, matchMode: 'contains' } });
    const [selectedWord, setSelectedWord] = useState(null);
    const [userLoaded, setUserLoaded] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalData, setModalData] = useState(null);

    // For Add Word Sidebar
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [newWordData, setNewWordData] = useState({ word: '', explanation: '', association: '' });

    useEffect(() => {
        dispatch(fetchAuthUser())
            .unwrap()
            .then(() => setUserLoaded(true))
            .catch(() => setUserLoaded(false));
    }, [dispatch]);

    useEffect(() => {
        if (userLoaded && user?.id) {
            dispatch(fetchWordsByUserId(user.id));
        }
    }, [dispatch, userLoaded, user]);

    useEffect(() => {
        if (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: error, life: 5000 });
        }
    }, [error]);

    const onRowEditComplete = (e) => {
        if (!user?.id) return;
        const { newData } = e;
        dispatch(saveWord({ userId: user.id, wordObj: newData }));
    };

    const textEditor = (options) => {
        return (
            <InputText
                type="text"
                value={options.value}
                onChange={(e) => options.editorCallback(e.target.value)}
            />
        );
    };

    const onRowDoubleClick = (e) => {
        setModalData(e.data);
        setModalVisible(true);
    };

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
            }
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
            }
        }
    ];

    const header = (
        <div className="p-input-icon-left mb-3 flex flex-wrap gap-2">
            <InputText
                type="search"
                onInput={(e) => setFilters({ global: { value: e.target.value, matchMode: 'contains' } })}
                placeholder="Search words..."
                className="p-inputtext-sm"
                style={{ flexGrow: 1, minWidth: '200px' }}
            />
            <Button
                label="Add New Word"
                icon="pi pi-plus"
                onClick={() => setSidebarVisible(true)}
                disabled={!userLoaded}
                className="p-button-primary"
            />
        </div>
    );

    // Save new word from sidebar
    const onSidebarSave = () => {
        if (!newWordData.word.trim()) {
            toast.current.show({ severity: 'warn', summary: 'Validation', detail: 'Word cannot be empty' });
            return;
        }
        if (!user?.id) {
            toast.current.show({ severity: 'error', summary: 'User not loaded', detail: 'Please wait until user data is loaded.' });
            return;
        }
        dispatch(saveWord({ userId: user.id, wordObj: newWordData }));
        setSidebarVisible(false);
        setNewWordData({ word: '', explanation: '', association: '' });
    };

    return (
        <div className="p-4">
            <Toast ref={toast} />
            <ConfirmDialog />
            <h2 className="text-xl font-semibold mb-4">Vocabulary Practice</h2>

            <DataTable
                value={words}
                loading={loading}
                dataKey="id"
                header={header}
                filters={filters}
                filterDisplay="row"
                globalFilterFields={['word', 'explanation', 'association']}
                editMode="row"
                onRowEditComplete={onRowEditComplete}
                onRowDoubleClick={onRowDoubleClick}
                contextMenuSelection={selectedWord}
                onContextMenuSelectionChange={(e) => setSelectedWord(e.value)}
                onContextMenu={(e) => {
                    setSelectedWord(e.data);
                    contextMenu.current.show(e.originalEvent);
                    e.originalEvent.preventDefault();
                }}
                tableStyle={{ minWidth: '50rem' }}
            >
                <Column field="word" header="Word" editor={textEditor} sortable filter filterPlaceholder="Filter by word" />
                <Column field="explanation" header="Explanation" editor={textEditor} sortable filter filterPlaceholder="Filter by explanation" />
                <Column field="association" header="Association" editor={textEditor} sortable filter filterPlaceholder="Filter by association" />
                <Column rowEditor headerStyle={{ width: '10%', minWidth: '8rem' }} bodyStyle={{ textAlign: 'center' }} />
            </DataTable>

            <ContextMenu model={cmItems} ref={contextMenu} />

            <Dialog
                visible={modalVisible}
                onHide={() => setModalVisible(false)}
                header={modalData?.word || 'Word Detail'}
                style={{ width: '100vw', maxWidth: '100vw', height: '100vh' }}
                modal
                dismissableMask
            >
                <div className="p-4">
                    <h3 className="mb-3">Explanation</h3>
                    <p>{modalData?.explanation}</p>
                </div>
            </Dialog>

            {/* Add Word Sidebar */}
            <Sidebar
                visible={sidebarVisible}
                position="top"
                fullScreen
                onHide={() => setSidebarVisible(false)}
                style={{ padding: '2rem', overflowY: 'auto' }}
            >
                <h2 className="mb-6">{`Add New Word`}</h2>

                <div className="p-fluid p-formgrid p-grid" style={{ gap: '1.5rem' }}>
                    <div className="p-field p-col-12 p-md-4">
                        <label htmlFor="word" className="mb-2 block">Word</label>
                        <InputText
                            id="word"
                            value={newWordData.word}
                            onChange={(e) => setNewWordData({ ...newWordData, word: e.target.value })}
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div className="p-field p-col-12 p-md-4">
                        <label htmlFor="explanation" className="mb-2 block">Explanation</label>
                        <InputText
                            id="explanation"
                            value={newWordData.explanation}
                            onChange={(e) => setNewWordData({ ...newWordData, explanation: e.target.value })}
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div className="p-field p-col-12 p-md-4">
                        <label htmlFor="association" className="mb-2 block">Association</label>
                        <InputText
                            id="association"
                            value={newWordData.association}
                            onChange={(e) => setNewWordData({ ...newWordData, association: e.target.value })}
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
