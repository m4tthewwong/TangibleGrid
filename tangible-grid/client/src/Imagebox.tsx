import React, { useState, useRef } from 'react';

const Imagebox = ({ data, containerDimensions }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [imageSrc, setImageSrc] = useState<string | null>(null);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => setImageSrc(e.target?.result as string);
            reader.readAsDataURL(event.target.files[0]);
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
        border: '3px solid grey',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    };

    const imageStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    };

    return (
        <div style={style} onClick={handleClick}>
            <input type="file" accept="image/*" ref={inputRef} style={{ display: 'none' }} onChange={handleImageChange} />
            {imageSrc && <img src={imageSrc} alt="Uploaded" style={imageStyle} />}
        </div>
    );
};

export default Imagebox;
