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

    useEffect(() => {
        if (containerRef.current) {
            const { width } = containerRef.current.getBoundingClientRect();
            const height = (4 / 3) * width;
            setContainerDimensions({ width, height });
        }
    }, []); // This effect hook runs once after the component mounts to get the dimensions of the container

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`http://localhost:3001/api/data`);
                const { data } = await response.json();
                if (data && data.length > 0) {
                    const newData = data.map((d) => JSON.parse(d)).map(parsed => ({
                        ...parsed,
                        x: Number(parsed.x),
                        y: Number(parsed.y),
                        h: Number(parsed.h),
                        w: Number(parsed.w),
                    }));
                    setArduinoDataArray(prevData => { // Supposed to be logic to add or remove textboxes based on type (not working)
                        return newData.reduce((acc, currData) => {
                            if (currData.type === "add") {
                                acc.push(currData);
                            } else if (currData.type === "delete") {
                                return acc.filter(item => item.ID !== currData.ID); 
                            }
                            return acc;
                        }, [...prevData]);
                    });
                }
            } catch (error) {
                console.error("Fetching data failed", error);
            }
        };

        const intervalId = setInterval(fetchData, 2000);
        return () => clearInterval(intervalId);
    }, []);


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
