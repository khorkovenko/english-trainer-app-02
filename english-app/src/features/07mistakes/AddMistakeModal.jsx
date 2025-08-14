import { useState, useEffect } from 'react'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { SelectButton } from 'primereact/selectbutton'
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

const mistakeTypeOptions = mistakeTypes.map(t => ({ label: t, value: t }))

const FloatingInput = ({ id, label, value, onChange, disabled }) => (
    <span
        className="p-float-label"
        style={{
            flex: '1 1 auto',
            width: '100%',
            display: 'inline-flex',
            flexDirection: 'column'
        }}
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
)

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
        <Dialog
            header="Add Mistake"
            visible={visible}
            onHide={onHide}
            style={{ width: '750px' }}
        >
            {/* Select Button */}
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
            <div className="card flex justify-content-center" style={{ margin: '1rem 0' }}>
                <SelectButton
                    id="type"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.value)}
                    options={mistakeTypeOptions}
                    multiple={false}
                    itemTemplate={(option) => (
                        <div style={{ textTransform: 'capitalize' }}>{option.label}</div>
                    )}
                />
            </div>

            {/* Floating Input */}
            <div style={{ margin: '1rem 0' }}>
                <FloatingInput
                    id="value"
                    label="Value"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
            </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <Button label="Close" className="p-button-secondary" onClick={onHide} />
                <Button
                    label="Add"
                    className="p-button-success"
                    onClick={handleAdd}
                    disabled={!selectedType || !value.trim()}
                />
            </div>
        </Dialog>
    )
}

export default AddMistakeModal
