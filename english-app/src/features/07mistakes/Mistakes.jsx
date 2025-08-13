// components/Mistakes.js
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMistakes, saveMistakes, addMistake } from './mistakesSlice'
import { InputText } from 'primereact/inputtext'

const mistakeTypes = [
    'vocabulary',
    'grammar',
    'reading',
    'listening',
    'speaking',
    'writing'
]

// FloatingInput component
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

    const rows = Array.from({ length: 30 }, (_, i) => {
        const row = {}
        mistakeTypes.forEach(type => {
            row[type] = data[type]?.[i] || ''
        })
        return row
    })

    return (
        <div
        >
            <h2 style={{ marginBottom: '0.5rem' }}>❌ Review Mistakes</h2>
            <p style={{ marginBottom: '1rem' }}>
                Analyze your mistakes and learn from them here.
            </p>

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
                                <div style={{ display: 'flex', gap: '0.1rem', justifyContent: 'center', alignItems: 'center'  }}>
                                    <FloatingInput
                                        id={`input-${type}`}
                                        label={`Add ${type} mistake`}
                                        value={inputs[type]}
                                        onChange={(e) =>
                                            setInputs({ ...inputs, [type]: e.target.value })
                                        }
                                        disabled={false}
                                    />
                                    <button
                                        onClick={() => handleAdd(type)}
                                        disabled={!inputs[type].trim()}
                                        style={{
                                            background: '#22c55e',
                                            color: 'white',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '0 0.5rem',
                                            height: '2rem',
                                            alignSelf: 'flex-end',
                                            borderRadius: '0.25rem',
                                        }}
                                    >
                                        <i className="pi pi-check"></i>
                                    </button>
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
                                        <span
                                            style={{ cursor: 'pointer', color: '#3b82f6' }}
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
        </div>
    )
}

export default Mistakes
