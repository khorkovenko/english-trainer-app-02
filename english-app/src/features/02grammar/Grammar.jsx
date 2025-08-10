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
import { fetchGrammarRules, saveGrammarRule, deleteGrammarRule } from './grammarSlice';
import { SplitButton } from 'primereact/splitbutton';

const FloatingInput = ({ id, label, value, onChange, disabled }) => (
    <span
        className="p-float-label"
        style={{ flex: '1 1 200px', minWidth: '200px', display: 'inline-flex', flexDirection: 'column' }}
    >
        <InputText id={id} value={value} onChange={onChange} disabled={disabled} className="w-full" />
        <label htmlFor={id}>{label}</label>
    </span>
);

const Grammar = () => {
    const dispatch = useDispatch();
    const toast = useRef(null);
    const { user } = useSelector(state => state.auth);
    const { rules, loading, error } = useSelector(state => state.grammar);
    const [newRule, setNewRule] = useState(() => {
        const saved = localStorage.getItem('newRuleData');
        return saved ? JSON.parse(saved) : { rule_name: '', html_explanation: '' };
    });
    const [selectedRule, setSelectedRule] = useState(null);
    const [showHtmlModal, setShowHtmlModal] = useState(false);
    const [filters, setFilters] = useState({ global: { value: null, matchMode: 'contains' } });

    useEffect(() => localStorage.setItem('newRuleData', JSON.stringify(newRule)), [newRule]);

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
        if (error && toast.current) {
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
        localStorage.removeItem('newRuleData');
    };

    const handleClear = () => {
        setNewRule({ rule_name: '', html_explanation: '' });
        setFilters({ global: { value: null, matchMode: 'contains' } });
        localStorage.removeItem('newRuleData');
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
        <InputText value={options.value} onChange={(e) => options.editorCallback(e.target.value)} />
    );

    const onRowEditComplete = (e) => {
        const { newData } = e;
        dispatch(saveGrammarRule({ userId: user.id, rule: newData }));
    };

    function stripHtml(html) {
        if (!html) return '';
        return html.replace(/<[^>]*>?/gm, '').trim();
    }

    const getItems = (rule) => {
        const ruleName = rule?.rule_name?.trim() || '';
        const explanation = stripHtml(rule?.html_explanation);
        return [
            {
                label: 'Create Dialogue',
                icon: 'pi pi-comments',
                command: () => {
                    const chatPrompt = `Create a dialogue using this grammar rule: ${ruleName} with explanation: ${explanation}`;
                    const encodedPrompt = encodeURIComponent(chatPrompt);
                    window.open(`https://chat.openai.com/?model=gpt-4&prompt=${encodedPrompt}`, '_blank');
                }
            },
            {
                label: 'Generate Quiz (Choose Answer)',
                icon: 'pi pi-question-circle',
                command: () => {
                    const chatPrompt = `Generate a multiple-choice quiz based on this grammar rule: ${ruleName} with explanation: ${explanation}`;
                    const encodedPrompt = encodeURIComponent(chatPrompt);
                    window.open(`https://chat.openai.com/?model=gpt-4&prompt=${encodedPrompt}`, '_blank');
                }
            },
            {
                label: 'Generate Quiz (Write Answer)',
                icon: 'pi pi-pencil',
                command: () => {
                    const chatPrompt = `Generate a fill-in-the-blank quiz based on this grammar rule: ${ruleName} with explanation: ${explanation}`;
                    const encodedPrompt = encodeURIComponent(chatPrompt);
                    window.open(`https://chat.openai.com/?model=gpt-4&prompt=${encodedPrompt}`, '_blank');
                }
            }
        ];
    };

    const showHelp = () => {
        const name = newRule.rule_name.trim();
        const explanation = stripHtml(newRule.html_explanation);
        if (name) {
            const promptText = `Create an adaptive HTML table explaining the grammar rule: "${name}," with sample usages. 
            All explanation and content must be in HTML only, wrapped in a single outer <div> tag. 
            All styles must be inline (using the style attribute directly in HTML). 
            Do not use any CSS classes or external stylesheets. 
            The layout should be responsive and readable on all screen sizes.`;
            const prompt = encodeURIComponent(promptText);
            const url = `https://chat.openai.com/?model=gpt-4&prompt=${prompt}`;
            window.open(url, '_blank');
        } else {
            toast.current.show({
                severity: 'error',
                summary: 'Empty rule name!',
                detail: 'Enter a rule name before requesting AI help.',
                life: 7000,
            });
        }
    };

    const header = (
        <div className="p-d-flex p-flex-wrap p-ai-center" style={{ gap: '0.5rem', marginTop: '.75rem' }}>
            <FloatingInput
                id="globalSearch"
                label="Search rules"
                value={filters.global?.value || ''}
                onChange={e => setFilters({ global: { value: e.target.value, matchMode: 'contains' } })}
            />
            <span
                style={{
                    color: 'var(--primary-color)',
                    fontWeight: 'bold',
                    fontSize: '1.5rem',
                    margin: '0 12px',
                    userSelect: 'none',
                    flexShrink: 0,
                }}
            >
                ||
            </span>
            <FloatingInput
                id="rule_name"
                label="Rule Name"
                value={newRule.rule_name}
                onChange={e => setNewRule({ ...newRule, rule_name: e.target.value })}
            />
            <FloatingInput
                id="html_explanation"
                label="HTML Explanation"
                value={newRule.html_explanation}
                onChange={e => setNewRule({ ...newRule, html_explanation: e.target.value })}
            />
            <Button label="Add" icon="pi pi-plus" onClick={handleAddRule} className="p-button-success" />
            <Button label="Clear" icon="pi pi-times" onClick={handleClear} className="p-button-secondary" />
            <Button label="Help" icon="pi pi-question-circle" onClick={showHelp} className="p-button-help" />
        </div>
    );

    return (
        <div className="p-4">
            <Toast ref={toast} />
            <ConfirmDialog />
            <h2 className="text-xl font-semibold mb-4">📘 Grammar Practice</h2>
            <DataTable
                value={rules}
                dataKey="id"
                editMode="row"
                onRowEditComplete={onRowEditComplete}
                tableStyle={{ minWidth: '60rem' }}
                emptyMessage="No grammar rules yet."
                header={header}
                filters={filters}
                globalFilterFields={['rule_name', 'html_explanation']}
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
                            <SplitButton
                                icon="pi pi-eye"
                                onClick={() => {
                                    setSelectedRule(row);
                                    setShowHtmlModal(true);
                                }}
                                model={getItems(row)}
                                severity="info"
                            />
                            <Button icon="pi pi-trash" className="p-button-danger p-button-sm" onClick={() => handleDelete(row)} />
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
