// components/Mistakes.js
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMistakes, saveMistakes, addMistake } from './mistakesSlice'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

const mistakeTypes = [
    'vocabulary',
    'grammar',
    'reading',
    'listening',
    'speaking',
    'writing'
]

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
        <div className="p-4 space-y-4">
            <h2 className="text-xl font-semibold">❌ Review Mistakes</h2>
            <p>Analyze your mistakes and learn from them here.</p>

            {status === 'loading' && <p>Loading...</p>}
            {status === 'failed' && <p>Error loading mistakes.</p>}

            <div className="grid gap-4">
                {mistakeTypes.map(type => (
                    <div key={type} className="flex gap-2 items-center">
                        <InputText
                            value={inputs[type]}
                            onChange={e => setInputs({ ...inputs, [type]: e.target.value })}
                            placeholder={`Add ${type} mistake...`}
                            style={{ flex: 1 }}
                        />
                        <Button
                            label="Add"
                            icon="pi pi-plus"
                            onClick={() => handleAdd(type)}
                            disabled={!inputs[type].trim()}
                        />
                    </div>
                ))}
            </div>

            <DataTable value={rows} responsiveLayout="scroll">
                {mistakeTypes.map(type => (
                    <Column
                        key={type}
                        field={type}
                        header={type.charAt(0).toUpperCase() + type.slice(1)}
                        body={(rowData) => {
                            const value = rowData[type]
                            if (!value) return <span>&nbsp;</span>
                            return (
                                <span
                                    className="cursor-pointer text-blue-500"
                                    onDoubleClick={() => {
                                        const prompt = encodeURIComponent(
                                            `Help me practice correcting this mistake: "${value}"`
                                        )
                                        window.open(
                                            `https://chat.openai.com/?model=gpt-4&prompt=${prompt}`,
                                            '_blank'
                                        )
                                    }}
                                >
                  {value}
                </span>
                            )
                        }}
                    />
                ))}
            </DataTable>
        </div>
    )
}

export default Mistakes
