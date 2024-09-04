import React from 'react';
import './Toolbar.css';

const Toolbar: React.FC<{ activeTextboxId: number | null }> = ({ activeTextboxId }) => {

    /* ------------------------------------------------------------- Functions ------------------------------------------------------------- */

    // Function to format text a certain way
    const formatText = (command: string, value?: string) => {
        document.execCommand(command, false, value);
    };

    // Function to activate voice recognition using the record button on the toolbar
    const startRecording = () => {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.start();

        recognition.onresult = (event) => {
            const speechToText = event.results[0][0].transcript;
            const focusedElement = document.activeElement;

            if (focusedElement && focusedElement.tagName === 'DIV' && focusedElement.getAttribute('contenteditable')) {
                document.execCommand('insertText', false, speechToText);
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
        };
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
            <select defaultValue="3" onChange={(e) => formatText('fontSize', e.target.value)} className="toolbar-select">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
                <option value="11">11</option>
                <option value="12">12</option>
                <option value="13">13</option>
                <option value="14">14</option>
                <option value="15">15</option>
                <option value="16">16</option>
                <option value="17">17</option>
                <option value="18">18</option>
                <option value="19">19</option>
                <option value="20">20</option>
            </select>
            <select defaultValue="black" onChange={(e) => formatText('foreColor', e.target.value)} className="toolbar-select">
                <option value="black">Black</option>
                <option value="red">Red</option>
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="yellow">Yellow</option>
                <option value="orange">Orange</option>
                <option value="purple">Purple</option>
                <option value="gray">Gray</option>
            </select>
            <select defaultValue="Verdana" onChange={(e) => formatText('fontName', e.target.value)} className="toolbar-select">
                <option value="Arial">Arial</option>
                <option value="Verdana">Verdana</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Comic Sans MS">Comic Sans MS</option>
                <option value="Courier New">Courier New</option>
                <option value="Lucida Console">Lucida Console</option>
                <option value="Tahoma">Tahoma</option>
            </select>
            <button className="toolbar-button" onClick={startRecording}>🎙️ Record</button>
            {/* Add more buttons as needed */}
        </div>
    );
};

export default Toolbar;
