import React, { useRef } from 'react';

const Textbox = ({ data, isActive, setActiveTextboxId, containerDimensions }) => {
    const textboxRef = useRef(null);

    const handleClick = () => setActiveTextboxId(data.ID);

    const style: React.CSSProperties = {
        position: 'absolute',
        left: `${(data.y / 12) * containerDimensions.width}px`,
        top: `${(data.x / 16) * containerDimensions.height}px`,
        width: `${(data.w / 12) * containerDimensions.width}px`,
        height: `${(data.h / 16) * containerDimensions.height}px`,
        border: '1px solid black',
        padding: '10px',
        textAlign: 'left',
    };

    return <div ref={textboxRef} style={style} contentEditable={true} onClick={handleClick}></div>;
};

export default Textbox;
