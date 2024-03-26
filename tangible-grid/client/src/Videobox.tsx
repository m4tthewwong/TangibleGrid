import React, { useState, useRef } from 'react';

const Videobox = ({ data, containerDimensions }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [videoSrc, setVideoSrc] = useState<string | null>(null);

    const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const url = URL.createObjectURL(event.target.files[0]);
            setVideoSrc(url);
        }
    };

    const handleClick = () => {
        inputRef.current?.click();
    };

    const style: React.CSSProperties = {
        position: 'absolute',
        left: `${(data.y / 12) * containerDimensions.width}px`,
        top: `${(data.x / 16) * containerDimensions.height}px`,
        width: `${(data.w / 12) * containerDimensions.width}px`,
        height: `${(data.h / 16) * containerDimensions.height}px`,
        border: '1px solid black',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    };

    const videoStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    };

    return (
        <div style={style} onClick={handleClick}>
            <input type="file" accept="video/*" ref={inputRef} style={{ display: 'none' }} onChange={handleVideoChange} />
            {videoSrc && <video src={videoSrc} controls style={videoStyle} />}
        </div>
    );
};

export default Videobox;
