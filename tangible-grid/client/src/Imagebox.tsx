import React, { useState, useRef } from 'react';

/* ------------------------------------------------------------- Interfaces ------------------------------------------------------------- */

interface ImageboxProps {
    data: {
        id: number;
        top_left_row: number;
        top_left_col: number;
        length: number;
        width: number;
    };
    containerDimensions: {
        width: number;
        height: number;
    };
    bracketId: number;
    setImageFileName: (id: number, fileName: string) => void;
}

const Imagebox: React.FC<ImageboxProps> = ({ data, containerDimensions, bracketId, setImageFileName }) => {

    /* ------------------------------------------------------------- useStates and useRefs ------------------------------------------------------------- */

    const inputRef = useRef<HTMLInputElement>(null);
    const [imageSrc, setImageSrc] = useState<string | null>(null);

    /* ------------------------------------------------------------- Functions ------------------------------------------------------------- */

    // Handles changing or adding an image to the imagebox
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();

            reader.onload = (e) => {
                const image = new Image();
                image.src = e.target?.result as string;

                image.onload = () => {
                    const imageAspectRatio = image.width / image.height;
                    const boxWidth = containerDimensions.width * (data.width / 12);
                    const boxHeight = containerDimensions.height * (data.length / 16);
                    const boxAspectRatio = boxWidth / boxHeight;

                    let speechText = '';

                    const columnWidth = containerDimensions.width / 12;
                    const rowHeight = containerDimensions.height / 16;

                    // Check if the image fits perfectly
                    if (Math.abs(imageAspectRatio - boxAspectRatio) < 0.01) {
                        speechText = 'The image fits perfectly within the box.';
                    } else if (imageAspectRatio > boxAspectRatio) {
                        // White space on top and bottom
                        const emptyHeight = boxHeight - (boxWidth / imageAspectRatio);
                        const emptyRows = emptyHeight / rowHeight;
                        const fullRows = Math.floor(emptyRows / 2);  // Dividing by 2 because space is on top and bottom
                        if (fullRows > 1) {
                            speechText = `There are ${fullRows} empty rows each on the top and bottom.`;
                        } else if (fullRows === 1) {
                            speechText = `There is ${fullRows} empty row each on the top and bottom.`;
                        } else {
                            speechText = 'The image fits in the box.';
                        }
                    } else {
                        // White space on left and right
                        const emptyWidth = boxWidth - (boxHeight * imageAspectRatio);
                        const emptyColumns = emptyWidth / columnWidth;
                        const fullColumns = Math.floor(emptyColumns / 2);  // Dividing by 2 because space is on the left and right
                        if (fullColumns > 1) {
                            speechText = `There are ${fullColumns} empty columns each on the left and right.`;
                        } else if (fullColumns === 1) {
                            speechText = `There is ${fullColumns} empty column each on the left and right.`;
                        } else {
                            speechText = 'The image fits in the box.';
                        }
                    }

                    // Add the image filename to the speech
                    speechText += ` The image file name is ${file.name}.`;

                    // Speak the result
                    speakText(speechText);
                };

                setImageSrc(e.target?.result as string);
                setImageFileName(data.id, file.name);
            };
            reader.readAsDataURL(file);
        }
    };

    // Inputting image into imagebox when clicked
    const handleClick = () => {
        inputRef.current?.click();
    };

    // Speech Synthesis settings
    const speakText = (text: string) => {
        const speech = new SpeechSynthesisUtterance(text);
        speech.lang = 'en-US';
        speech.pitch = 1;
        speech.rate = 1;
        window.speechSynthesis.speak(speech);
    };

    /* ------------------------------------------------------------- Style ------------------------------------------------------------- */

    const style: React.CSSProperties = {
        position: 'absolute',
        left: `${(((data.top_left_col) / 12) * containerDimensions.width) + 10}px`,
        top: `${(((data.top_left_row) / 16) * containerDimensions.height) + 10}px`,
        width: `${(((data.width + 1) / 12) * containerDimensions.width) - 20}px`,
        height: `${(((data.length + 1) / 16) * containerDimensions.height) - 20}px`,
        border: '3px solid grey',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden', // Ensure no overflow outside the box
        backgroundColor: '#FAF9F6',
        borderRadius: '10px',
    };

    const imageStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
    };

    return (
        <div style={style} data-id={data.id} onClick={handleClick}>
            <input type="file" accept="image/*" ref={inputRef} style={{ display: 'none' }} id={`file-input-${bracketId}`} onChange={handleImageChange} />
            {imageSrc && <img src={imageSrc} alt="Uploaded" style={imageStyle} />}
        </div>
    );
};

export default Imagebox;
