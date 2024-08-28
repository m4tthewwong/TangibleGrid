import React, { useState, useRef } from 'react';

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
        left: `${((data.top_left_col - 1) / 11) * containerDimensions.width}px`,
        top: `${((data.top_left_row - 1) / 15) * containerDimensions.height}px`,
        width: `${((data.width - 1) / 11) * containerDimensions.width}px`,
        height: `${((data.length - 1) / 15) * containerDimensions.height}px`,
        border: '3px solid grey',
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
