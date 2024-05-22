import React, { useState, useRef } from 'react';

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
}

const Imagebox: React.FC<ImageboxProps> = ({ data, containerDimensions }) => {
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
        left: `${(data.top_left_col / 12) * containerDimensions.width}px`,
        top: `${(data.top_left_row / 16) * containerDimensions.height}px`,
        width: `${(data.width / 12) * containerDimensions.width}px`,
        height: `${(data.length / 16) * containerDimensions.height}px`,
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
