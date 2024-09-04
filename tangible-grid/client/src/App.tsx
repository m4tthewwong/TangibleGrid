import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import Textbox from './Textbox.tsx';
import Imagebox from './Imagebox.tsx';
import Videobox from './Videobox.tsx';
import Toolbar from './Toolbar.tsx';
import { ArduinoData } from './types'; // Type definitions

/* ------------------------------------------------------------- Recently Added Features ------------------------------------------------------------- */
// ALL BRACKETS
// If bracket added, say status, type, location, and size
// If bracket removed, say status, type
// If bracket modified, say status, type, location, size, and content (can be empty for text) (guaranteed empty for image/video)
// TEXT BRACKETS
// When adding text bracket, let users know the maximum number of characters they can add into the textbox (for now, one grid - 25 letters)
// When modified text bracket, let users know the current number of characters already inputted in the textbox out of the maximum
// ^Using Web Speech API's SpeechSynthesis feature
// Keyboard number pushed is the id of the bracket that gets the information repeated
// Have image fitted into image box with remaining white space and let the user know where the white space is through the speech synthesis
// push "-" key to verbalize the % of empty space of the webpage

/* ------------------------------------------------------------- Known Issues ------------------------------------------------------------- */
// NOT A PROBLEM - You must say "stop" before confirming the textbox, it will keep recording (ideal fix is when you confirm a textbox, it should stop all instances of speech recognition - attempted)
// Error 404 with new arduino code - (old code - COULD POSSIBLY HAPPEN WHEN CONFIRMING EMPTY TEXT BOX) (new code - COULD POSSIBLY HAPPEN WHEN CONFIRMING ANY TEXT BOX)
// while speech recognition is running, the speech synthesis doesn't get run (ideal fix for this would be to not run the speech recognition until the speech synthesis has finished running)
// When you add a textbox (one instance of speech recognition) and user clicks record (another instance) (or perhaps if you click record twice), you get an error (probably not a big idea - can be fixed by disabling record button while speech recognition is active)
// You have to click toolbar stuff twice for it to work except for alignment and microphone
// if you click record, you have to click the textbox again

/* ------------------------------------------------------------- Fixed issues ------------------------------------------------------------- */
// If you don't speak for a couple of seconds, speech recognition will end
// "title" text doesn't get bolded or increased in font size

/* ------------------------------------------------------------- Things that need to be tested ------------------------------------------------------------- */
// See what happens if you add a textbox and remove the textbox, does it still record? (possible fix would be stopping all instances of speech recognition when removing a textbox)

/* ------------------------------------------------------------- New features to be added ------------------------------------------------------------- */
// "alexa end" command to confirm text in textbox
// ctrl + id# to activate content editing for the textbox
// make sure code ignores "touch"

const App = () => {
    /* ------------------------------------------------------------- useStates and useRefs ------------------------------------------------------------- */

    const [arduinoDataArray, setArduinoDataArray] = useState<ArduinoData[]>([]);
    const [arduinoChanges, setArduinoChanges] = useState<ArduinoData>();
    const [activeTextboxId, setActiveTextboxId] = useState<number | null>(null);
    const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const isUserInitiatedRef = useRef(false); // Used to fix a bug where I get a random window confirmation after saving the text in a textbox
    const recognitionRef = useRef<typeof SpeechRecognition | null>(null); // Ref to keep track of recognition instance
    const [isTextboxFocused, setIsTextboxFocused] = useState(false); // Track textbox focus state

    /* ------------------------------------------------------------- Functions ------------------------------------------------------------- */

    // Function to calculate the percentage of empty space on the webpage
    const calculateEmptySpacePercentage = useCallback(() => {
        if (!containerRef.current) return 100;
        
        const containerArea = containerDimensions.width * containerDimensions.height;
        let filledArea = 0;

        arduinoDataArray.forEach(data => {
            if (data.status === "Added" || data.status === "Modified") {
                const boxWidth = containerDimensions.width * (data.width / 12);
                const boxHeight = containerDimensions.height * (data.length / 16);
                filledArea += boxWidth * boxHeight;
            }
        });

        const emptySpacePercentage = ((containerArea - filledArea) / containerArea) * 100;
        return emptySpacePercentage;
    }, [arduinoDataArray, containerDimensions]);

    // Speech Synthesis
    const handleBracketSpeech = useCallback((bracket) => {
        let speechText = '';

        // General bracket information
        const location = `at row ${bracket.top_left_row} and column ${bracket.top_left_col}`;
        const size = `with a width of ${bracket.width} and height of ${bracket.length}`;

        switch (bracket.status) {
            case 'Added':
                speechText = `A ${bracket.type.toLowerCase()} bracket was added ${location} ${size}.`;
                if (bracket.type === 'Text') {
                    speechText += ` You can add up to ${bracket.width * bracket.length * 25} characters.`;
                }
                break;
            
            case 'Removed':
                speechText = `A ${bracket.type.toLowerCase()} bracket was removed.`;
                break;
            
            case 'Modified':
                speechText = `A ${bracket.type.toLowerCase()} bracket was modified ${location} ${size}.`;
                if (bracket.type === 'Text') {
                    let cleanContent = bracket.content.replace(/<\/?[^>]+(>|$)/g, ""); // Cleaned out the html elements out of the content
                    const characterCount = cleanContent.length;
                    if (characterCount > 0) {
                        speechText += ` The content in the textbox currently is   ${cleanContent}.`;
                    } else {
                        speechText += ` There is no content in the textbox.`;
                    }
                    speechText += ` The textbox currently contains ${characterCount} characters out of a maximum of ${bracket.width * bracket.length * 25}.`;
                }
                break;
            
            default:
                return;  // No action if status is not recognized
        }

        // Speak the constructed speech text
        console.log("Speech Text: ", speechText);
        speakText(speechText);
    }, []);

    // Updating content in the database with an API call
    const updateContentInDatabase = useCallback(async (id, content, retries = 5) => {
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
    }, []);

    // Speech Recognition
    const startSpeechRecognition = useCallback(() => {
        if (!recognitionRef.current) {
            recognitionRef.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognitionRef.current.lang = 'en-US';
            recognitionRef.current.interimResults = false;
            recognitionRef.current.maxAlternatives = 1;
            recognitionRef.current.continuous = true;  // Set to continuous listening mode
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
                console.log("Debugging: ", speechToText);
                speechToText = speechToText.replace('alexa title', '').trim(); // Remove the command part and keep the rest as the title
                if (speechToText) {
                    const focusedElement = document.activeElement;
                    if (focusedElement && focusedElement.tagName === 'DIV' && focusedElement.getAttribute('contenteditable')) {
                        // Creating a span with the desired styles and inserting it (since execCommand decided to not work)
                        const span = document.createElement('span');
                        span.style.fontSize = '20px';
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
                if (speechToText) {
                    speechToText = speechToText.replace('alexa', '').trim(); // Remove the command part and keep the rest as the text
                    // Remove any existing formatting and insert normal text
                    document.execCommand('removeFormat');
                    document.execCommand('justifyLeft');
                    document.execCommand('insertText', false, speechToText + '\n');
                }
            }
        };
    
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
        };
    
        recognition.start(); // Start the initial recognition
    }, [activeTextboxId]);

    // Speech Synthesis settings
    const speakText = (text) => {
        const speech = new SpeechSynthesisUtterance(text);
        speech.lang = 'en-US';
        speech.pitch = 1;
        speech.rate = 1;
        window.speechSynthesis.speak(speech);
    };

    // Handles changes in the database based on inputs from the Arduino
    const handleDatabaseChange = useCallback((change) => {
        if (isUserInitiatedRef.current) {
            isUserInitiatedRef.current = false;
            return;
        }

        console.log("Handling database change:", change);
        setArduinoDataArray(prevData => {
            const existingItem = prevData.find(item => item.id === change.id);

            // Call handleBracketSpeech for added, removed, and modified states
            handleBracketSpeech(change);

            // if (change.touch && change.type === 'Text') {
                // setActiveTextboxId(change.id);
            // }
            if (change.type === 'Text') {
                setActiveTextboxId(change.id);
            }
            
            if (change.status === 'Modified') { // Right now, only text brackets can be modified (will be different in the future)
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
                // Activate speech recognition if touch is true and type is Text
                // if (change.touch && change.type === 'Text') {

                // Activate speech recognition if type is Text (we are ignoring touch for now)
                if (change.type === 'Text') {
                    startSpeechRecognition();  // Trigger speech recognition for textboxes
                }
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
    }, [startSpeechRecognition, updateContentInDatabase, handleBracketSpeech]);

    /* ------------------------------------------------------------- useEffects ------------------------------------------------------------- */
    
    // Using ctrl + {bracket id} to focus the textbox with an id of {bracket id}
    useEffect(() => {
        const handleAltPlusNumber = (event: KeyboardEvent) => {
            if (event.altKey && event.key >= '0' && event.key <= '9') {
                const bracketId = parseInt(event.key, 10);
                const bracket = arduinoDataArray.find(data => data.id === bracketId);

                if (bracket) {
                    if (bracket.type === 'Text') {
                        setActiveTextboxId(bracketId);
                        setTimeout(() => {
                            const textbox = document.querySelector(`[data-id="${bracketId}"]`) as HTMLElement;
                            if (textbox) {
                                textbox.focus();
                            }
                        }, 0);
                    } else if (bracket.type === 'Image' || bracket.type === 'Video') {
                        // Trigger a click event on the corresponding file input
                        const fileInput = document.querySelector(`#file-input-${bracketId}`) as HTMLInputElement;
                        if (fileInput) {
                            fileInput.click();
                        }
                    } else {
                        console.log(`No supported action for bracket id ${bracketId}`);
                    }
                } else {
                    console.log(`No bracket found with id ${bracketId}`);
                }
            }
        };

        window.addEventListener('keydown', handleAltPlusNumber);

        return () => {
            window.removeEventListener('keydown', handleAltPlusNumber);
        };
    }, [arduinoDataArray]);

    // Fetch initial data from server on component mount with API call
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

    // Watch for database changes with API call
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

    // Listening for Keyboard Events
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            // Listen for "-" key press to announce the empty space percentage
            if (event.key === '-' && !isTextboxFocused) {
                const emptySpacePercentage = calculateEmptySpacePercentage();
                const speechText = `The webpage is ${emptySpacePercentage.toFixed(2)} percent empty.`;
                console.log("User pressed '-' button: ", speechText);
                speakText(speechText);
            }

            // Handling number keys 0-9 for bracket speech synthesis
            if (event.key >= '0' && event.key <= '9' && !isTextboxFocused) {
                const bracketId = parseInt(event.key, 10);
                const bracket = arduinoDataArray.find(data => data.id === bracketId);
                if (bracket) {
                    handleBracketSpeech(bracket);
                } else {
                    console.log(`No bracket found with id ${bracketId}`);
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [calculateEmptySpacePercentage, isTextboxFocused, arduinoDataArray, handleBracketSpeech]);

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
                                    onFocus={() => setIsTextboxFocused(true)} // Set focus state
                                    onBlur={() => setIsTextboxFocused(false)}  // Unset focus state
                                    containerDimensions={containerDimensions}
                                    updateContent={updateContentInDatabase}
                                />
                            );
                        case 'Image':
                            return <Imagebox key={data.id} data={data} containerDimensions={containerDimensions} bracketId={data.id} />;
                        case 'Video':
                            return <Videobox key={data.id} data={data} containerDimensions={containerDimensions} bracketId={data.id} />;
                        default:
                            return null;
                    }
                })}
            </div>
        </div>
    );
};

export default App;