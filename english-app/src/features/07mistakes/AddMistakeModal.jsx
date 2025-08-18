import { useState, useEffect } from 'react'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { SelectButton } from 'primereact/selectbutton'
import { InputText } from 'primereact/inputtext'
import { useSelector, useDispatch } from 'react-redux'
import { addMistake, saveMistakes } from './mistakesSlice'
import FloatingInput from "../../components/FloatingInput";

const mistakeTypes = [
    'vocabulary',
    'grammar',
    'reading',
    'listening',
    'speaking',
    'writing'
]

const mistakeTypeOptions = mistakeTypes.map(t => ({ label: t, value: t }))

const AddMistakeModal = ({ visible, onHide, initialType = null }) => {
    const dispatch = useDispatch()
    const mistakesMap = useSelector(state => state.mistakes.data)

    const [selectedType, setSelectedType] = useState(initialType || mistakeTypes[0])
    const [value, setValue] = useState('')

    useEffect(() => {
        if (visible) {
            setSelectedType(initialType || mistakeTypes[0])
            setValue('')
        }
    }, [visible, initialType])

    const handleAdd = async () => {
        if (!selectedType || !value.trim()) return

        dispatch(addMistake({ type: selectedType, value: value.trim() }))

        const updatedMistakes = {
            ...mistakesMap,
            [selectedType]: [value.trim(), ...(mistakesMap[selectedType] || [])].slice(0, 30)
        }
        await dispatch(saveMistakes(updatedMistakes))

        setValue('')
        setSelectedType(initialType || mistakeTypes[0])
        onHide()
    }

    return (
        <Dialog
            header="Add Mistake: choose type and enter description"
            visible={visible}
            onHide={onHide}
            style={{ width: '750px' }}
        >
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ margin: '1rem 0', width: '100%' }}>
                    <SelectButton
                        id="type"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.value)}
                        options={mistakeTypeOptions}
                        multiple={false}
                        className="w-full"
                        itemTemplate={(option) => (
                            <div style={{ textTransform: 'capitalize' }}>{option.label}</div>
                        )}
                    />
                </div>

                <div style={{ margin: '1rem 0', width: '100%' }}>
                    <FloatingInput
                        id="value"
                        label="Mistake description"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        width="700px"
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%' }}>
                    <Button label="Close" className="p-button-secondary" onClick={onHide} />
                    <Button
                        label="Add"
                        className="p-button-success"
                        onClick={handleAdd}
                        disabled={!selectedType || !value.trim()}
                    />
                </div>
            </div>
        </Dialog>
    )
}


export default AddMistakeModal
