import { useState, useEffect } from 'react'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { useSelector, useDispatch } from 'react-redux'
import { addMistake, saveMistakes } from './mistakesSlice'

const mistakeTypes = [
    'vocabulary',
    'grammar',
    'reading',
    'listening',
    'speaking',
    'writing'
]

const AddMistakeModal = ({ visible, onHide, initialType = null }) => {
    const dispatch = useDispatch()
    const mistakesMap = useSelector(state => state.mistakes.data)
    const [selectedType, setSelectedType] = useState(initialType)
    const [value, setValue] = useState('')

    useEffect(() => {
        setSelectedType(initialType)
    }, [initialType])

    const handleAdd = async () => {
        if (!selectedType || !value.trim()) return

        dispatch(addMistake({ type: selectedType, value: value.trim() }))

        const updatedMistakes = {
            ...mistakesMap,
            [selectedType]: [value.trim(), ...(mistakesMap[selectedType] || [])].slice(0, 30)
        }
        await dispatch(saveMistakes(updatedMistakes))

        setValue('')
        setSelectedType(initialType)
        onHide()
    }

    return (
        <Dialog header="Add Mistake" visible={visible} onHide={onHide} style={{ width: '400px' }}>
            <div className="p-field" style={{ marginBottom: '1rem' }}>
                <label htmlFor="type">Type</label>
                <Dropdown
                    id="type"
                    value={selectedType}
                    options={mistakeTypes.map(t => ({ label: t, value: t }))}
                    onChange={(e) => setSelectedType(e.value)}
                    placeholder="Select a mistake type"
                    className="w-full"
                />
            </div>
            <div className="p-field" style={{ marginBottom: '1rem' }}>
                <label htmlFor="value">Value</label>
                <InputText
                    id="value"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Enter mistake"
                    className="w-full"
                />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <Button label="Close" className="p-button-secondary" onClick={onHide} />
                <Button label="Add" className="p-button-success" onClick={handleAdd} disabled={!selectedType || !value.trim()} />
            </div>
        </Dialog>
    )
}

export default AddMistakeModal
