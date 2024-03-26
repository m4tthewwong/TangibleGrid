import React from 'react';
import './Toolbar.css';

const Toolbar = ({ activeTextboxId }) => {
    const formatText = (command, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
    };

    return (
        <div id="toolbar" className="toolbar" style={{ marginBottom: '20px' }}>
            <button onClick={() => formatText('bold')} className="toolbar-button"><b>Bold</b></button>
            <button onClick={() => formatText('italic')} className="toolbar-button"><i>Italic</i></button>
            <button onClick={() => formatText('underline')} className="toolbar-button"><u>Underline</u></button>
            <button onClick={() => formatText('strikeThrough')} className="toolbar-button"><s>Strike</s></button>
            <button onClick={() => formatText('justifyLeft')} className="toolbar-button">Left</button>
            <button onClick={() => formatText('justifyCenter')} className="toolbar-button">Center</button>
            <button onClick={() => formatText('justifyRight')} className="toolbar-button">Right</button>
            <button onClick={() => formatText('insertOrderedList')} className="toolbar-button">OL</button>
            <button onClick={() => formatText('insertUnorderedList')} className="toolbar-button">UL</button>
            {/* Add more buttons as needed */}
        </div>
    );
};

export default Toolbar;
