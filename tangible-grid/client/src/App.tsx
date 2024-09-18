/* ------------------------------------------------------------- Recently Added Features ------------------------------------------------------------- */
// ALL BRACKETS
// If bracket added, say status, type, location, and size
// If bracket removed, say status, type
// If bracket modified, say status, type, location, size, and content (can be empty for text) (guaranteed empty for image/video)
// TEXT BRACKETS
// When adding text bracket, let users know the maximum number of characters they can add into the textbox (for now, one grid - 16 letters)
// When modified text bracket, let users know the current number of characters already inputted in the textbox out of the maximum
// ^Using Web Speech API's SpeechSynthesis feature
// Keyboard number pushed is the id of the bracket that gets the information repeated
// Have image fitted into image box with remaining white space and let the user know where the white space is through the speech synthesis
// push "-" key to verbalize the % of empty space of the webpage
// "alexa end" command to confirm text in textbox
// alt + id# to focus textboxes, imageboxes, and videoboxes
// make sure code ignores "touch"
// Verbalize AND repeat the empty number of rows and columns on the edges of the imagebox if bigger than one column or row and repeat image file name
// Calculate recommended characters
// Change normal text to 40, remove formatting from the title, default text needs to be 40px
// "-" command should also state the number of textboxes, imageboxes, and videoboxes on the website

/* ------------------------------------------------------------- Known Issues ------------------------------------------------------------- */
/* -------------------- Priority -------------------- */
// Toolbar record button doesn't speech record title/text properly
/* -------------------- Slight priority -------------------- */
// You have to click toolbar stuff twice for it to work except for alignment and microphone
// If you click record, you have to click the textbox again
// "alexa next line" command doesn't work after text that has been typed with the keyboard (only works after text spoken from the speech recognition)
/* -------------------- Not a priority -------------------- */
// NOT A PROBLEM - You must say "stop" before confirming the textbox, it will keep recording (ideal fix is when you confirm a textbox, it should stop all instances of speech recognition - attempted)
// When you add a textbox (one instance of speech recognition) and user clicks record (another instance), you get an error (ideal fix is disabling record button while speech recognition is active)
// If you add a textbox and then remove it without stopping alexa, it still records the user's voice (ideal fix would be stopping all instances of speech recognition when removing a textbox)
// Speech recognition is recording the speech synthesis but isn't causing any problems at all (ideal fix is stopping speech recognition until speech synthesis is done)

// alexa stop doesn't confirm (don't use alexa end)

/* ------------------------------------------------------------- Fixed issues ------------------------------------------------------------- */
// If you don't speak for a couple of seconds, speech recognition will end
// "title" text doesn't get bolded or increased in font size
// White space between brackets
// Doesn't verbalize first bracket - NOTE: CLICK GOOGLE CHROME TO FOCUS IT
// Speaks multiple times (major issue)
// Speaks after text confirmation (had to do with not verbalizing first bracket)

/* ------------------------------------------------------------- Things that need to be tested ------------------------------------------------------------- */
/* ------------------------------------------------------------- New features to be added ------------------------------------------------------------- */
/* -------------------- Priority -------------------- */
/* -------------------- Slight priority -------------------- */
// Add imagebox features to videobox?
/* -------------------- Not a priority -------------------- */
// Text overflowing - get rid of scroll bar (problem with getting rid of this is that the text can overflow past the textbox, extending it)

/* ------------------------------------------------------------- Beginning of Code ------------------------------------------------------------- */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import Textbox from './Textbox.tsx';
import Imagebox from './Imagebox.tsx';
import Videobox from './Videobox.tsx';
import Toolbar from './Toolbar.tsx';
import { ArduinoData } from './types'; // Type definitions

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
    const [imageFileNames, setImageFileNames] = useState<{ [key: number]: string }>({});

    // Refs to avoid adding state variables to dependencies
    const containerDimensionsRef = useRef(containerDimensions);
    const imageFileNamesRef = useRef(imageFileNames);

    /* ------------------------------------------------------------- Functions ------------------------------------------------------------- */

    // Set the image file name in the state
    const setImageFileName = (id: number, fileName: string) => {
        setImageFileNames((prev) => ({
            ...prev,
            [id]: fileName,
        }));
    };

    // Function to calculate the percentage of empty space on the webpage
    const calculateEmptySpacePercentage = useCallback(() => {
        if (!containerRef.current) return 100;
        
        const containerArea = containerDimensions.width * containerDimensions.height;
        let filledArea = 0;

        arduinoDataArray.forEach(data => {
            if (data.status === "Added" || data.status === "Modified") {
                const boxWidth = containerDimensions.width * ((data.width + 1) / 12);
                const boxHeight = containerDimensions.height * ((data.length + 1) / 16);
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
                    let cleanContent = bracket.content.replace(/<\/?[^>]+(>|$)/g, ""); // Cleaned out the html elements out of the content
                    const characterCount = cleanContent.length;
                    speechText += characterCount > 0
                        ? ` The content in the textbox is:     ${cleanContent}.`
                        : ' There is no content in the textbox.';
                    speechText += ` The textbox currently contains ${characterCount} characters out of a maximum of ${bracket.width * bracket.length * 16}. The recommended number of characters in this box is ${((bracket.length-1) * bracket.width * 16) + 1}`;
                }
                
                if (bracket.type === 'Image') {
                    // Calculate empty rows/columns based on the image
                    const imageElement = document.querySelector(`#file-input-${bracket.id}`);
                    const imageBox = document.querySelector(`[data-id="${bracket.id}"]`) as HTMLElement;
                    
                    if (imageElement && imageBox) {
                        const boxWidth = containerDimensionsRef.current.width * (bracket.width / 12);
                        const boxHeight = containerDimensionsRef.current.height * (bracket.length / 16);
                        const columnWidth = containerDimensionsRef.current.width / 12;
                        const rowHeight = containerDimensionsRef.current.height / 16;
                        
                        if (imageBox.querySelector('img')) {
                            const img = imageBox.querySelector('img') as HTMLImageElement;
                            const imageAspectRatio = img.naturalWidth / img.naturalHeight;
                            const boxAspectRatio = boxWidth / boxHeight;
            
                            if (Math.abs(imageAspectRatio - boxAspectRatio) < 0.01) {
                                speechText += ` The image fits perfectly in the box.`;
                            } else if (imageAspectRatio > boxAspectRatio) {
                                const emptyHeight = boxHeight - (boxWidth / imageAspectRatio);
                                const emptyRows = emptyHeight / rowHeight;
                                const fullRows = Math.floor(emptyRows / 2);
                                if (fullRows > 1) {
                                    speechText += ` There are ${fullRows} empty rows each on the top and bottom.`;
                                } else if (fullRows === 1) {
                                    speechText += ` There is ${fullRows} empty row each on the top and bottom.`;
                                } else {
                                    speechText += ' The image fits in the box.';
                                }
                            } else {
                                const emptyWidth = boxWidth - (boxHeight * imageAspectRatio);
                                const emptyColumns = emptyWidth / columnWidth;
                                const fullColumns = Math.floor(emptyColumns / 2);
                                if (fullColumns > 1) {
                                    speechText += ` There are ${fullColumns} empty columns each on the left and right.`;
                                } else if (fullColumns === 1) {
                                    speechText += ` There is ${fullColumns} empty column each on the left and right.`;
                                } else {
                                    speechText += ' The image fits in the box.';
                                }
                            }
                            
                            // Add the image filename to the speech
                            const fileName = imageFileNamesRef.current[bracket.id];
                            if (fileName) {
                                speechText += ` The image file name is ${fileName}.`;
                            }

                            console.log("Filename: ", fileName);
                        } else {
                            speechText += ` The imagebox is empty.`;
                        }
                    }
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
                    speechText += characterCount > 0
                        ? ` The content in the textbox is:     ${cleanContent}.`
                        : ' There is no content in the textbox.';
                    speechText += ` The textbox currently contains ${characterCount} characters out of a maximum of ${bracket.width * bracket.length * 16}. The recommended number of characters in this box is ${((bracket.length-1) * bracket.width * 16) + 1}`;
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

            /* if (speechToText.includes('alexa end')) {
                if (activeTextboxId !== null) {
                    const activeTextbox = document.querySelector(`[data-id="${activeTextboxId}"]`);
                    if (activeTextbox) {
                        (activeTextbox as HTMLElement).blur();
                        console.log(`Textbox with id ${activeTextboxId} confirmed.`);
                    }
                }
            } */
    
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

            if (speechToText.startsWith('alexa next line')) {
                const focusedElement = document.activeElement;
                if (focusedElement && focusedElement.tagName === 'DIV' && focusedElement.getAttribute('contenteditable')) {
                    const selection = window.getSelection();
                    if (selection && selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
        
                        // Insert a <br> element to create a new line
                        const br = document.createElement('br');
                        range.insertNode(br);
        
                        // Move the cursor after the <br>
                        range.setStartAfter(br);
                        range.setEndAfter(br);
                        selection.removeAllRanges();
                        selection.addRange(range);
        
                        console.log('Moved to the next line.');
                    }
                }
            }
            if (speechToText.startsWith('alexa title input one') || speechToText.startsWith('alexa title input 1')) {
                speechToText = 'Welcome to my lovely hometown island!';
                if (speechToText) {
                    const focusedElement = document.activeElement;
                    if (focusedElement && focusedElement.tagName === 'DIV' && focusedElement.getAttribute('contenteditable')) {
                        // Creating a span with the desired styles and inserting it (since execCommand decided to not work)
                        const span = document.createElement('span');
                        span.style.fontSize = '40px';
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
            } else if (speechToText.startsWith('alexa title')) {
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

            if (speechToText.startsWith('alexa text')) {
                speechToText = speechToText.replace('alexa text', '').trim(); // Remove the command part and keep the rest as the title
                if (speechToText) {
                    const focusedElement = document.activeElement;
                    if (focusedElement && focusedElement.tagName === 'DIV' && focusedElement.getAttribute('contenteditable')) {
                        // Creating a span with the desired styles and inserting it (since execCommand decided to not work)
                        const span = document.createElement('span');
                        span.style.fontSize = '20px';
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
    
    // Listening for Keyboard Events
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            console.log("Key Pressed: ", event.key);
            // Check if Alt is pressed
            if (event.altKey && event.key >= '0' && event.key <= '9') {
                // Handle Alt + number (focus specific textbox/imagebox/videobox)
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
                    }
                } else {
                    console.log(`No bracket found with id ${bracketId}`);
                }
            } 
            // Handle only number key press (without Alt)
            else if (!event.altKey && event.key >= '0' && event.key <= '9') {
                const bracketId = parseInt(event.key, 10);
                const bracket = arduinoDataArray.find(data => data.id === bracketId);
                if (bracket) {
                    handleBracketSpeech(bracket);
                } else {
                    console.log(`No bracket found with id ${bracketId}`);
                }
            }

            // Handle "-" key press to announce the empty space percentage
            if (!event.altKey && event.key === '-') {
                const emptySpacePercentage = calculateEmptySpacePercentage();
            
                // Count the number of each type of bracket
                const textBoxCount = arduinoDataArray.filter(data => data.type === 'Text' && (data.status === "Added" || data.status === "Modified")).length;
                const imageBoxCount = arduinoDataArray.filter(data => data.type === 'Image' && (data.status === "Added" || data.status === "Modified")).length;
                const videoBoxCount = arduinoDataArray.filter(data => data.type === 'Video' && (data.status === "Added" || data.status === "Modified")).length;
            
                const speechText = `The webpage is ${emptySpacePercentage.toFixed(2)} percent empty. ` +
                                   `There ${textBoxCount === 1 ? 'is' : 'are'} ${textBoxCount} ${textBoxCount === 1 ? 'textbox' : 'textboxes'}, ` +
                                   `${imageBoxCount === 1 ? 'is' : 'are'} ${imageBoxCount} ${imageBoxCount === 1 ? 'imagebox' : 'imageboxes'}, ` +
                                   `and ${videoBoxCount === 1 ? 'is' : 'are'} ${videoBoxCount} ${videoBoxCount === 1 ? 'videobox' : 'videoboxes'}.`;
            
                console.log("User pressed '-' button: ", speechText);
                speakText(speechText);
            }            
        };

        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [calculateEmptySpacePercentage, isTextboxFocused, arduinoDataArray, handleBracketSpeech]);

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
            console.log("Dimensions: ", width, height);
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
    
    // Keep refs in sync with the actual state
    useEffect(() => {
        containerDimensionsRef.current = containerDimensions;
    }, [containerDimensions]);

    useEffect(() => {
        imageFileNamesRef.current = imageFileNames;
    }, [imageFileNames]);

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
                            return <Imagebox key={data.id} data={data} containerDimensions={containerDimensions} bracketId={data.id} setImageFileName={setImageFileName} />;
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