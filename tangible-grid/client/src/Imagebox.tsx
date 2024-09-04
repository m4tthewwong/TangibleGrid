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
}

const Imagebox: React.FC<ImageboxProps> = ({ data, containerDimensions, bracketId }) => {

    /* ------------------------------------------------------------- useStates and useRefs ------------------------------------------------------------- */

    const inputRef = useRef<HTMLInputElement>(null);
    const [imageSrc, setImageSrc] = useState<string | null>(null);

    /* ------------------------------------------------------------- Functions ------------------------------------------------------------- */

    // Handles changing or adding an image to the imagebox
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
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

                    if (Math.abs(imageAspectRatio - boxAspectRatio) < 0.01) {
                        speechText = 'The image fits perfectly within the box.';
                    } else if (imageAspectRatio > boxAspectRatio) {
                        speechText = 'There is white space on the top and bottom.';
                    } else {
                        speechText = 'There is white space on the left and right.';
                    }
                    speakText(speechText);
                };

                setImageSrc(e.target?.result as string);
            };
            reader.readAsDataURL(event.target.files[0]);
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
        left: `${((data.top_left_col) / 12) * containerDimensions.width}px`,
        top: `${((data.top_left_row) / 16) * containerDimensions.height}px`,
        width: `${(((data.width) / 12) * containerDimensions.width)}px`,
        height: `${((data.length) / 16) * containerDimensions.height}px`,
        border: '3px solid grey',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden', // Ensure no overflow outside the box
    };

    const imageStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
    };

    return (
        <div style={style} onClick={handleClick}>
            <input type="file" accept="image/*" ref={inputRef} style={{ display: 'none' }} id={`file-input-${bracketId}`} onChange={handleImageChange} />
            {imageSrc && <img src={imageSrc} alt="Uploaded" style={imageStyle} />}
        </div>
    );
};

export default Imagebox;
