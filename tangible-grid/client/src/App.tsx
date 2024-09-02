import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import Textbox from './Textbox.tsx';
import Imagebox from './Imagebox.tsx';
import Videobox from './Videobox.tsx';
import Toolbar from './Toolbar.tsx';
import { ArduinoData } from './types'; // Type definitions

// ALL BRACKETS
// If bracket added, say status, type, location, and size
// If bracket removed, say status, type
// If bracket modified, say status, type, location, size, and content (can be empty for text) (guaranteed empty for image/video)

// TEXT BRACKETS
// When adding text bracket, let users know the maximum number of characters they can add into the textbox (for now, one grid - 25 letters)
// When modified text bracket, let users know the current number of characters already inputted in the textbox out of the maximum

// ^Using Web Speech API's SpeechSynthesis feature

// Test what happens when I add the textbox (one instance of speech recognition) and user clicks record (another instance)
// See what happens if you add a textbox and remove the textbox, does it still record?

const App = () => {
    const [arduinoDataArray, setArduinoDataArray] = useState<ArduinoData[]>([]);
    const [arduinoChanges, setArduinoChanges] = useState<ArduinoData>();
    const [activeTextboxId, setActiveTextboxId] = useState<number | null>(null);
    const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const isUserInitiatedRef = useRef(false); // Used to fix a bug where I get a random window confirmation after saving the text in a textbox

    const startSpeechRecognition = useCallback(() => {
        let recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        
        let stopRecognition = false;  // Flag to control whether recognition should restart
        let isRecognitionActive = false;  // Flag to track if recognition is active
    
        // Function to continuously restart speech recognition
        const restartRecognition = () => {
            if (!stopRecognition && !isRecognitionActive) {  // Only restart if the stop command hasn't been issued and recognition is not already running
                recognition.start();
                isRecognitionActive = true;
            }
        };
    
        recognition.onstart = () => {
            isRecognitionActive = true;  // Mark recognition as active when it starts
        };
    
        recognition.onend = () => {
            isRecognitionActive = false;  // Mark recognition as inactive when it ends
            if (!stopRecognition) {
                restartRecognition();  // Restart recognition if it hasn't been stopped
            }
        };
    
        recognition.onresult = (event) => {
            let speechToText = event.results[0][0].transcript.toLowerCase();
    
            console.log("Recognized Speech:", speechToText); // Debugging log
    
            if (speechToText.includes('stop')) {
                stopRecognition = true;  // Set the flag to prevent restarting
                recognition.stop();  // Stop recognition on command
                console.log("Stopping recognition: ", speechToText);  // Debugging log
                return;
            }
    
            if (speechToText.startsWith('title')) {
                // Remove the command part and keep the rest as the title
                speechToText = speechToText.replace('title', '').trim();
                if (speechToText) {
                    // Apply title formatting and insert the spoken text as the title
                    document.execCommand('bold'); // Not working
                    document.execCommand('fontSize', false, '5'); // Not working
                    document.execCommand('justifyCenter');
                    document.execCommand('insertText', false, speechToText + '\n');
                    document.execCommand('removeFormat');  // Reset formatting after the title
                }
            } else {
                if (speechToText) {
                    // Remove any existing formatting and insert normal text
                    document.execCommand('removeFormat');
                    document.execCommand('justifyLeft');
                    document.execCommand('insertText', false, speechToText + '\n');
                }
            }
        };
    
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            isRecognitionActive = false;  // Reset the active flag on error to allow restarting
            if (!stopRecognition) {
                restartRecognition();  // Restart on error unless stopped
            }
        };
    
        // Start the initial recognition
        restartRecognition();
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

    const speakText = (text) => {
        const speech = new SpeechSynthesisUtterance(text);
        speech.lang = 'en-US';
        speech.pitch = 1;
        speech.rate = 1;
        window.speechSynthesis.speak(speech);
    };

    // Function to handle speaking based on bracket status
    const handleBracketSpeech = (bracket) => {
        let speechText = '';

        // General bracket information
        const location = `at row ${bracket.top_left_row} and column ${bracket.top_left_col}`;
        const size = `with a width of ${bracket.width} and height of ${bracket.length}`;

        switch (bracket.status) {
            case 'Added':
                speechText = `A ${bracket.type.toLowerCase()} bracket was added ${location} ${size}.`;
                if (bracket.type === 'Text') {
                    speechText += ` You can add up to 25 characters.`;
                }
                break;
            
            case 'Removed':
                speechText = `A ${bracket.type.toLowerCase()} bracket was removed.`;
                break;
            
            case 'Modified':
                speechText = `A ${bracket.type.toLowerCase()} bracket was modified ${location} ${size}.`;
                if (bracket.type === 'Text') {
                    const characterCount = bracket.content.length;
                    speechText += ` The textbox currently contains ${characterCount} characters out of a maximum of 25.`;
                }
                break;
            
            default:
                return;  // No action if status is not recognized
        }

        // Speak the constructed speech text
        speakText(speechText);
    };

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

    const updateContentInDatabase = async (id, content, retries = 5) => {
        isUserInitiatedRef.current = true; // Set the flag before updating
        let attempts = 0;
    
        while (attempts < retries) {
            try {
                const response = await fetch(`http://localhost:3001/api/modify/id/${id}/content/${encodeURIComponent(content)}`, {
                    method: 'POST',
                });
    
                if (!response.ok) {
                    throw new Error(`Server responded with status ${response.status}`);
                }
    
                const result = await response.json();
                setArduinoDataArray(prevData => {
                    const updatedData = prevData.map(item => item.id === parseInt(id) ? { ...item, content } : item);
                    console.log("Updated data after content modification:", updatedData);
                    return [...updatedData];
                });
                console.log(content);
                console.log('Update response:', result);
                return; // Exit if successful
            } catch (error) {
                attempts += 1;
                console.error(`Failed to update content, attempt ${attempts}:`, error);
                if (attempts >= retries) {
                    console.error('Max retries reached. Giving up.');
                } else {
                    console.log('Retrying...');
                }
            }
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