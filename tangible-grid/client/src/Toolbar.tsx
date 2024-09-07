import React, { useRef, useCallback } from 'react';
import './Toolbar.css';

const Toolbar: React.FC<{ activeTextboxId: number | null }> = ({ activeTextboxId }) => {

    /* ------------------------------------------------------------- useStates and useRefs ------------------------------------------------------------- */

    const recognitionRef = useRef<typeof SpeechRecognition | null>(null); // Ref to keep track of recognition instance

    /* ------------------------------------------------------------- Functions ------------------------------------------------------------- */

    // Function to format text a certain way
    const formatText = (command: string, value?: string) => {
        document.execCommand(command, false, value);
    };

    const startSpeechRecognition = useCallback(() => {
        if (!recognitionRef.current) {
            recognitionRef.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognitionRef.current.lang = 'en-US';
            recognitionRef.current.interimResults = false;
            recognitionRef.current.maxAlternatives = 1;
            recognitionRef.current.continuous = true;  // Set to continuous listening mode - can't tell if this works
        }
    
        const recognition = recognitionRef.current;
    
        let stopRecognition = false;
    
        recognition.onstart = () => {
            console.log("Speech recognition started.");
        };
    
        recognition.onend = () => {
            console.log("Speech recognition ended.");
            if (!stopRecognition) {
                recognition.start();  // Automatically restart recognition if it ends unexpectedly (ex. not talking)
            }
        };
    
        recognition.onresult = (event) => {
            let speechToText = event.results[event.resultIndex][0].transcript.toLowerCase().trim();
            console.log("Recognized Speech:", speechToText);

            if (speechToText.includes('alexa end')) {
                if (activeTextboxId !== null) {
                    const activeTextbox = document.querySelector(`[data-id="${activeTextboxId}"]`);
                    if (activeTextbox) {
                        (activeTextbox as HTMLElement).blur();
                        console.log(`Textbox with id ${activeTextboxId} confirmed.`);
                    }
                }
            }
    
            if (speechToText.includes('alexa stop')) {
                if (activeTextboxId !== null) {
                    const activeTextbox = document.querySelector(`[data-id="${activeTextboxId}"]`);
                    if (activeTextbox) {
                        (activeTextbox as HTMLElement).blur();
                        console.log(`Textbox with id ${activeTextboxId} confirmed.`);
                    }
                }

                stopRecognition = true;  // Set the flag to prevent restarting
                recognition.stop();
                console.log("Stopping recognition: ", speechToText);
                return;
            }
    
            if (speechToText.startsWith('alexa title')) {
                speechToText = speechToText.replace('alexa title', '').trim(); // Remove the command part and keep the rest as the title
                if (speechToText) {
                    const focusedElement = document.activeElement;
                    if (focusedElement && focusedElement.tagName === 'DIV' && focusedElement.getAttribute('contenteditable')) {
                        // Creating a span with the desired styles and inserting it (since execCommand decided to not work)
                        const span = document.createElement('span');
                        span.style.fontSize = '80px';
                        span.style.fontWeight = 'bold';
                        span.textContent = speechToText;
                    
                        const selection = window.getSelection();
                        if (selection && selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            range.deleteContents();
                            range.insertNode(span);
                        
                            // Move the cursor after the span
                            range.setStartAfter(span);
                            range.setEndAfter(span);

                            // Insert the new line after the title text
                            const br = document.createElement('br');
                            range.insertNode(br);
                        
                            // Adjust the selection range to be after the <br> element
                            range.setStartAfter(br);
                            range.setEndAfter(br);
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }
                    }
                }
            } 

            if (speechToText.startsWith('alexa')) {
                speechToText = speechToText.replace('alexa', '').trim(); // Remove the command part and keep the rest as the title
                if (speechToText) {
                    const focusedElement = document.activeElement;
                    if (focusedElement && focusedElement.tagName === 'DIV' && focusedElement.getAttribute('contenteditable')) {
                        // Creating a span with the desired styles and inserting it (since execCommand decided to not work)
                        const span = document.createElement('span');
                        span.style.fontSize = '40px';
                        span.style.fontWeight = 'normal';
                        span.textContent = speechToText;
                        
                        const selection = window.getSelection();
                        if (selection && selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            range.deleteContents();
                            range.insertNode(span);
                            
                            // Move the cursor after the span
                            range.setStartAfter(span);
                            range.setEndAfter(span);
                            
                            // Insert the new line after the title text
                            const br = document.createElement('br');
                            range.insertNode(br);
                            
                            // Adjust the selection range to be after the <br> element
                            range.setStartAfter(br);
                            range.setEndAfter(br);
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }
                    }
                }
            }            
        };
    
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
        };
    
        recognition.start(); // Start the initial recognition
    }, [activeTextboxId]);

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
            <button className="toolbar-button" onClick={startSpeechRecognition}>🎙️ Record</button>
            {/* Add more buttons as needed */}
        </div>
    );
};

export default Toolbar;
