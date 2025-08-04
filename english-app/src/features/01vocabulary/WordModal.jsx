import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

const WordModal = ({ wordData, onClose, visible }) => {
    if (!wordData) return null;

    return (
        <Dialog
            header={wordData.word}
            visible={visible}
            style={{ width: '50vw', minWidth: '300px' }}
            modal
            onHide={onClose}
            closeOnEscape={true}
            dismissableMask={true}
            breakpoints={{ '960px': '75vw', '640px': '90vw' }}
        >
            <h3>Explanation</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{wordData.explanation || '—'}</p>

            <h3>Association</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{wordData.association || '—'}</p>

            <div className="p-d-flex p-jc-end p-mt-4">
                <Button label="Close" onClick={onClose} />
            </div>
        </Dialog>
    );
};

export default WordModal;
