import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { fetchAuthUser } from '../loginModal/authSlice';

import {
    fetchGrammarRules,
    saveGrammarRule,
    deleteGrammarRule
} from './grammarSlice';

const Grammar = () => {
    const dispatch = useDispatch();
    const toast = useRef(null);

    const { user } = useSelector(state => state.vocab); // re-use from vocab slice
    const { rules, loading, error } = useSelector(state => state.grammar);

    const [newRule, setNewRule] = useState({ rule_name: '', html_explanation: '' });
    const [selectedRule, setSelectedRule] = useState(null);
    const [showHtmlModal, setShowHtmlModal] = useState(false);

    useEffect(() => {
        if (!user?.id) {
            dispatch(fetchAuthUser()).unwrap().then(res => {
                dispatch(fetchGrammarRules(res.id));
            });
        } else {
            dispatch(fetchGrammarRules(user.id));
        }
    }, [dispatch, user]);

    useEffect(() => {
        if (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: error, life: 4000 });
        }
    }, [error]);

    const handleAddRule = () => {
        if (!newRule.rule_name.trim()) {
            toast.current.show({ severity: 'warn', summary: 'Validation', detail: 'Rule name is required' });
            return;
        }
        if (!user?.id) return;

        dispatch(saveGrammarRule({ userId: user.id, rule: newRule }));
        setNewRule({ rule_name: '', html_explanation: '' });
    };

    const handleDelete = (rule) => {
        confirmDialog({
            message: `Delete rule "${rule.rule_name}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: () => {
                dispatch(deleteGrammarRule({ userId: user.id, ruleId: rule.id }));
            }
        });
    };

    const textEditor = (options) => (
        <InputText
            value={options.value}
            onChange={(e) => options.editorCallback(e.target.value)}
        />
    );

    const onRowEditComplete = (e) => {
        const { newData } = e;
        dispatch(saveGrammarRule({ userId: user.id, rule: newData }));
    };

    return (
        <div className="p-4">
            <Toast ref={toast} />
            <ConfirmDialog />

            <h2 className="text-xl font-semibold mb-4">📘 Grammar Practice</h2>

            <div className="flex flex-wrap gap-2 mb-3">
                <span className="p-float-label">
                    <InputText
                        id="rule_name"
                        value={newRule.rule_name}
                        onChange={e => setNewRule(prev => ({ ...prev, rule_name: e.target.value }))}
                        className="w-64"
                    />
                    <label htmlFor="rule_name">Rule Name</label>
                </span>
                <span className="p-float-label">
                    <InputText
                        id="html_explanation"
                        value={newRule.html_explanation}
                        onChange={e => setNewRule(prev => ({ ...prev, html_explanation: e.target.value }))}
                        className="w-96"
                    />
                    <label htmlFor="html_explanation">HTML Explanation</label>
                </span>
                <Button label="Add" icon="pi pi-plus" onClick={handleAddRule} className="p-button-success" />
                <Button
                    label="Clear"
                    icon="pi pi-times"
                    className="p-button-secondary"
                    onClick={() => setNewRule({ rule_name: '', html_explanation: '' })}
                />
            </div>

            <DataTable
                value={rules}
                dataKey="id"
                editMode="row"
                onRowEditComplete={onRowEditComplete}
                tableStyle={{ minWidth: '60rem' }}
                emptyMessage="No grammar rules yet."
            >
                <Column field="rule_name" header="Rule Name" editor={textEditor} sortable />
                <Column
                    field="html_explanation"
                    header="HTML Explanation"
                    body={(row) => <span dangerouslySetInnerHTML={{ __html: row.html_explanation }} />}
                    editor={textEditor}
                />
                <Column
                    body={(row) => (
                        <div className="flex gap-2">
                            <Button
                                icon="pi pi-eye"
                                className="p-button-info p-button-sm"
                                onClick={() => {
                                    setSelectedRule(row);
                                    setShowHtmlModal(true);
                                }}
                            />
                            <Button
                                icon="pi pi-trash"
                                className="p-button-danger p-button-sm"
                                onClick={() => handleDelete(row)}
                            />
                        </div>
                    )}
                    header="Actions"
                />
                <Column rowEditor header="Edit" />
            </DataTable>

            <Dialog
                visible={showHtmlModal}
                onHide={() => setShowHtmlModal(false)}
                header={selectedRule?.rule_name || 'Rule'}
                style={{ width: '50vw' }}
                modal
            >
                <div dangerouslySetInnerHTML={{ __html: selectedRule?.html_explanation || '' }} />
            </Dialog>
        </div>
    );
};

export default Grammar;
