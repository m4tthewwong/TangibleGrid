import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import Textbox from './Textbox.tsx';
import Imagebox from './Imagebox.tsx';
import Videobox from './Videobox.tsx';
import Toolbar from './Toolbar.tsx';
import { ArduinoData } from './types'; // Type definitions

const App = () => {
    const [arduinoDataArray, setArduinoDataArray] = useState<ArduinoData[]>([]);
    const [arduinoChanges, setArduinoChanges] = useState<ArduinoData>();
    const [activeTextboxId, setActiveTextboxId] = useState<number | null>(null);
    const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const isUserInitiatedRef = useRef(false); // Used to fix a bug where I get a random window confirmation after saving the text in a textbox

    const startSpeechRecognition = useCallback(() => {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        // Function to continuously restart speech recognition
        const restartRecognition = () => {
            recognition.start();
        };
    
        recognition.start();
    
        recognition.onresult = (event) => {
            let speechToText = event.results[0][0].transcript.toLowerCase();

            console.log("Recognized Speech:", speechToText); // Debugging log

            if (speechToText.includes('stop')) {
                recognition.stop();  // Stop recognition on command
                console.log("Stopping recognition: ", speechToText);  // Debugging log
                return;
            } 

            if (speechToText.startsWith('title')) {
                // Remove the command part and keep the rest as the title
                speechToText = speechToText.replace('title', '').trim();
                if (speechToText) {
                    // Apply title formatting and insert the spoken text as the title
                    document.execCommand('bold');
                    document.execCommand('fontSize', false, '5');
                    document.execCommand('justifyCenter');
                    document.execCommand('insertText', false, speechToText + '\n');
                    document.execCommand('removeFormat');  // Reset formatting after the title
                }
            }
            else {
            // Check for text command
            //if (speechToText.startsWith('text')) {
                // Remove the command part and keep the rest as normal text
                //speechToText = speechToText.replace('text', '').trim();
                if (speechToText) {
                    // Remove any existing formatting and insert normal text
                    document.execCommand('removeFormat');
                    document.execCommand('justifyLeft');
                    document.execCommand('insertText', false, speechToText + '\n');
                }
            }

            //restartRecognition(); // Restart recognition after processing the result, unless stopped
        };

        recognition.onend = () => {
            // Restart recognition when it ends (unless explicitly stopped by the "stop" command)
            restartRecognition();
        };
    
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
        };
        //recognition.onerror = (event) => {
            //console.error('Speech recognition error:', event.error);
            //if (event.error !== 'no-speech' && event.error !== 'aborted') {
                //// If there is an error other than 'no-speech' or 'aborted', restart recognition
                //restartRecognition();
            //}
        //};
    }, []);    

    // Fetch initial data from server on component mount
    useEffect(() => {
        const initFetch = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/init', { method: 'POST' });
                const data = await response.json();
                console.log(data);
                setArduinoDataArray(data);
            } catch (error) {
                console.error('Failed to fetch initial data:', error);
            }
        };

        initFetch();
    }, []);

    // Calculate container dimensions on mount
    useEffect(() => {
        if (containerRef.current) {
            const { width } = containerRef.current.getBoundingClientRect();
            const height = (4 / 3) * width;
            setContainerDimensions({ width, height });
        }
    }, []);

    const handleDatabaseChange = useCallback((change) => {
        if (isUserInitiatedRef.current) {
            isUserInitiatedRef.current = false;
            return;
        }

        console.log("Handling database change:", change);
        setArduinoDataArray(prevData => {
            const existingItem = prevData.find(item => item.id === change.id);
            // Activate speech recognition if touch is true and type is Text
            if (change.touch && change.type === 'Text') {
                setActiveTextboxId(change.id);
                startSpeechRecognition();  // Trigger speech recognition for textboxes
            }
            
            if (change.status === 'Modified') {
                const restore = window.confirm("Do you want to restore the previous content?");
                if (restore) {
                    const previousItem = prevData.find(item => item.id === change.id && item.status === 'Removed');
                    if (previousItem) {
                        change.content = previousItem.content;
                    }
                    const updatedData = prevData.map(item => item.id === change.id ? { ...change, content: change.content, status: 'Modified' } : item);
                    console.log("Updated data after restoring:", updatedData);
                    return [...updatedData];
                } else {
                    updateContentInDatabase(change.id, " ");
                    const updatedData = prevData.map(item => item.id === change.id ? { ...change, content: " ", status: 'Modified' } : item);
                    console.log("Updated data after not restoring:", updatedData);
                    return [...updatedData];
                }
            } else if (!existingItem && change.status === 'Added') {
                console.log("Added prevdata:", prevData);
                return [...prevData, { ...change }];
            } else if (existingItem && change.status === 'Removed') {
                const updatedData = prevData.map(item => item.id === change.id ? { ...existingItem, status: "Removed" } : item);
                console.log("Prev data: ", prevData);
                return [...updatedData];
            } else if (existingItem) {
                const updatedData = prevData.map(item => item.id === change.id ? change : item);
                return [...updatedData];
            }
            return prevData;
        });
    }, [startSpeechRecognition]);

    // Watch for database changes
    useEffect(() => {
        const fetchChanges = async () => {
            try {
                console.log("Watching for changes...");

                const response = await fetch('http://localhost:3001/api/watch', { method: 'POST' });
                const data = await response.json();
                console.log("Data:", data);
                handleDatabaseChange(data);
                setArduinoChanges(data);
            } catch (error) {
                console.error('Failed to watch for database changes:', error);
            }
        };

        fetchChanges();
    }, [arduinoChanges, handleDatabaseChange]);

    const updateContentInDatabase = async (id, content) => {
        isUserInitiatedRef.current = true; // Set the flag before updating
        try {
            const response = await fetch(`http://localhost:3001/api/modify/id/${id}/content/${encodeURIComponent(content)}`, {
                method: 'POST',
            });
            const result = await response.json();
            setArduinoDataArray(prevData => {
                const updatedData = prevData.map(item => item.id === parseInt(id) ? { ...item, content } : item);
                console.log("Updated data after content modification:", updatedData);
                return [...updatedData];
            });
            console.log(content);
            console.log('Update response:', result);
        } catch (error) {
            console.error('Failed to update content:', error);
        }
    };

    return (
        <div className="App">
            <Toolbar activeTextboxId={activeTextboxId} />
            <div id="container" ref={containerRef}>
                {arduinoDataArray.filter(data => data.status === "Added" || data.status === "Modified").map((data) => {
                    switch (data.type) {
                        case 'Text':
                            return (
                                <Textbox
                                    key={data.id}
                                    data={data}
                                    isActive={data.id === activeTextboxId}
                                    setActiveTextboxId={setActiveTextboxId}
                                    containerDimensions={containerDimensions}
                                    updateContent={updateContentInDatabase}
                                />
                            );
                        case 'Image':
                            return <Imagebox key={data.id} data={data} containerDimensions={containerDimensions} />;
                        case 'Video':
                            return <Videobox key={data.id} data={data} containerDimensions={containerDimensions} />;
                        default:
                            return null;
                    }
                })}
            </div>
        </div>
    );
};

export default App;