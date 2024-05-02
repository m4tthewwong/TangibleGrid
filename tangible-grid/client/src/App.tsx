import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Textbox from './Textbox.tsx';
import Imagebox from './Imagebox.tsx';
import Videobox from './Videobox.tsx';
import Toolbar from './Toolbar.tsx';
import { ArduinoData } from './types'; // Type definitions

const App = () => {
    const [arduinoDataArray, setArduinoDataArray] = useState<ArduinoData[]>([]);
    const [activeTextboxId, setActiveTextboxId] = useState<string | null>(null);
    const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch initial data from server on component mount
    useEffect(() => {
        const initFetch = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/init', { method: 'POST' });
                const data = await response.json();
                console.log(data);
                setArduinoDataArray(data);
                console.log(response);
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

    // Watch for database changes
    useEffect(() => {
        const fetchChanges = async () => {
            try {
                console.log("Watching for changes...");

                const response = await fetch('http://localhost:3001/api/watch', { method: 'POST' });
                const data = await response.json();
                console.log("Data:", data);
                handleDatabaseChange(data);
            } catch (error) {
                console.error('Failed to watch for database changes:', error);
            }
        };

        fetchChanges();
    }, []);

    const handleDatabaseChange = (change) => {
        console.log("Handling database change:", change);
        setArduinoDataArray(prevData => {
            const existingItem = prevData.find(item => item.ID === change.ID);
            if (!existingItem && change.type === 'add') {
                const restore = window.confirm("Do you want to restore the previous content?");
                if (restore) {
                    // Attempting to restore with existing content
                    return [...prevData, change];
                } else {
                    // Attempting to add without content
                    return [...prevData, { ...change, content: '' }];
                }
            } else if (change.type === 'delete') {
                return prevData.filter(item => item.ID !== change.ID);
            }
            return [...prevData];
        });
    };

    // Function to update content on the database
    const updateContentInDatabase = async (id, content) => {
        try {
            const response = await fetch(`http://localhost:3001/api/modify/id/${id}/content/${encodeURIComponent(content)}`, {
                method: 'POST',
            });
            const result = await response.json();
            console.log('Update response:', result);
        } catch (error) {
            console.error('Failed to update content:', error);
        }
    };

    return (
        <div className="App">
            <Toolbar activeTextboxId={activeTextboxId} />
            <div id="container" ref={containerRef}> {/* Add the ref */}
                {arduinoDataArray.filter(data => data.type === "add").map((data) => { /* Only add brackets of type "add" */
                    switch (data.bracket) {
                        case 'text':
                            return (
                                <Textbox
                                    key={data.ID}
                                    data={data}
                                    isActive={data.ID === activeTextboxId}
                                    setActiveTextboxId={setActiveTextboxId}
                                    containerDimensions={containerDimensions}
                                    updateContent={updateContentInDatabase}
                                />
                            );
                        case 'figure':
                            return <Imagebox key={data.ID} data={data} containerDimensions={containerDimensions} />;
                        case 'video':
                            return <Videobox key={data.ID} data={data} containerDimensions={containerDimensions} />;
                        default:
                            return null;
                    }
                })}
            </div>
        </div>
    );
};

export default App;
