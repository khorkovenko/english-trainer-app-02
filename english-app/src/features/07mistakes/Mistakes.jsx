// components/Mistakes.js
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMistakes, saveMistakes, addMistake } from './mistakesSlice'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'

const mistakeTypes = [
    'vocabulary',
    'grammar',
    'reading',
    'listening',
    'speaking',
    'writing'
]

// FloatingInput component (do not change)
const FloatingInput = ({ id, label, value, onChange, disabled }) => (
    <span
        className="p-float-label"
        style={{
            flex: '1 1 160px',
            width: '100px',
            display: 'inline-flex',
            flexDirection: 'column'
        }}
    >
        <InputText id={id} value={value} onChange={onChange} disabled={disabled} className="w-full" />
        <label htmlFor={id}>{label}</label>
    </span>
)

const Mistakes = () => {
    const dispatch = useDispatch()
    const { data, status } = useSelector(state => state.mistakes)
    const [inputs, setInputs] = useState(
        mistakeTypes.reduce((acc, t) => ({ ...acc, [t]: '' }), {})
    )
    const [search, setSearch] = useState('')

    useEffect(() => {
        dispatch(fetchMistakes())
    }, [dispatch])

    const handleAdd = (type) => {
        const value = inputs[type].trim()
        if (!value) return
        dispatch(addMistake({ type, value }))
        dispatch(saveMistakes({ ...data, [type]: [value, ...data[type]] }))
        setInputs({ ...inputs, [type]: '' })
    }

    // Delete single mistake
    const handleDelete = (type, index) => {
        confirmDialog({
            message: 'Are you sure you want to delete this mistake?',
            header: 'Confirm Deletion',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const updated = [...data[type]]
                updated.splice(index, 1)
                dispatch(saveMistakes({ ...data, [type]: updated }))
            }
        })
    }

    // Delete all mistakes
    const handleDeleteAll = () => {
        confirmDialog({
            message: 'Are you sure you want to delete all mistakes?',
            header: 'Confirm Deletion',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const emptyData = mistakeTypes.reduce((acc, t) => ({ ...acc, [t]: [] }), {})
                dispatch(saveMistakes(emptyData))
            }
        })
    }

    const rows = Array.from({ length: 30 }, (_, i) => {
        const row = {}
        mistakeTypes.forEach(type => {
            const filtered = data[type]?.filter(m => m.toLowerCase().includes(search.toLowerCase())) || []
            row[type] = filtered[i] || ''
        })
        return row
    })

    return (
        <div>
            <h2 style={{ marginBottom: '0.5rem' }}>❌ Review Mistakes</h2>
            <p style={{ marginBottom: '1rem' }}>
                Analyze your mistakes and learn from them here.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '1rem' }}>
                <InputText
                    placeholder="Search mistakes..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ width: '200px' }}
                />
                <Button label="Delete All" icon="pi pi-trash" severity="danger" onClick={handleDeleteAll} />
            </div>

            <div style={{ flex: 1, overflow: 'auto' }}>
                <table
                    style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        tableLayout: 'fixed',
                        minWidth: '100%',
                    }}
                >
                    <thead>
                    <tr>
                        {mistakeTypes.map((type) => (
                            <th
                                key={type}
                                style={{
                                    border: '1px solid #ddd',
                                    padding: '0.5rem',
                                    background: '#f9f9f9',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 1,
                                }}
                            >
                                <div style={{ display: 'flex', gap: '0.1rem', justifyContent: 'center', alignItems: 'center', marginTop: '12px'}}>
                                    <FloatingInput
                                        id={`input-${type}`}
                                        label={`Add ${type} mistake`}
                                        value={inputs[type]}
                                        onChange={(e) =>
                                            setInputs({ ...inputs, [type]: e.target.value })
                                        }
                                        disabled={false}
                                    />
                                    <Button
                                        icon="pi pi-check"
                                        className="p-button-success p-button-sm"
                                        onClick={() => handleAdd(type)}
                                        disabled={!inputs[type].trim()}
                                    />
                                </div>
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {mistakeTypes.map((type) => (
                                <td
                                    key={type}
                                    style={{
                                        border: '1px solid #ddd',
                                        padding: '0.5rem',
                                        textAlign: 'left',
                                    }}
                                >
                                    {row[type] ? (
                                        <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span
                                                style={{ cursor: 'pointer', color: '#3b82f6', flex: 1 }}
                                                onDoubleClick={() => {
                                                    const prompt = encodeURIComponent(
                                                        `Help me practice correcting this mistake: "${row[type]}"`
                                                    )
                                                    window.open(
                                                        `https://chat.openai.com/?model=gpt-4&prompt=${prompt}`,
                                                        '_blank'
                                                    )
                                                }}
                                            >
                                                {row[type]}
                                            </span>
                                            <Button
                                                icon="pi pi-trash"
                                                className="p-button-danger p-button-text p-button-sm"
                                                onClick={() => handleDelete(type, rowIndex)}
                                            />
                                        </span>
                                    ) : (
                                        '\u00A0'
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <ConfirmDialog />
        </div>
    )
}

export default Mistakes
