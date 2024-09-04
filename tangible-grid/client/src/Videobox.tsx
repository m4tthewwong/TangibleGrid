import React, { useState, useRef } from 'react';

/* ------------------------------------------------------------- Interfaces ------------------------------------------------------------- */

interface VideoboxProps {
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
}

const Videobox: React.FC<VideoboxProps> = ({ data, containerDimensions }) => {

    /* ------------------------------------------------------------- useStates and useRefs ------------------------------------------------------------- */

    const inputRef = useRef<HTMLInputElement>(null);
    const [videoSrc, setVideoSrc] = useState<string | null>(null);

    /* ------------------------------------------------------------- Functions ------------------------------------------------------------- */

    // Handles changing or adding a video to the videobox
    const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const url = URL.createObjectURL(event.target.files[0]);
            setVideoSrc(url);
        }
    };

    // Inputting video into videobox when clicked
    const handleClick = () => {
        inputRef.current?.click();
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

    const videoStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
    };

    return (
        <div style={style} onClick={handleClick}>
            <input type="file" accept="video/*" ref={inputRef} style={{ display: 'none' }} onChange={handleVideoChange} />
            {videoSrc && <video src={videoSrc} controls style={videoStyle} />}
        </div>
    );
};

export default Videobox;
