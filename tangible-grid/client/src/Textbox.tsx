import React, { useRef } from 'react';

interface TextboxProps {
    data: {
        ID: string;
        x: number;
        y: number;
        h: number;
        w: number;
    };
    isActive: boolean;
    setActiveTextboxId: (id: string | null) => void;
    containerDimensions: {
        width: number;
        height: number;
    };
    updateContent: (id: string, content: string) => void;
}

const Textbox: React.FC<TextboxProps> = ({ data, isActive, setActiveTextboxId, containerDimensions, updateContent }) => {
    // Explicitly typing the ref as HTMLDivElement
    const textboxRef = useRef<HTMLDivElement>(null);

    const handleClick = () => {
        setActiveTextboxId(data.ID);
    };

    // intended to trigger an action when the Textbox loses focus
    const handleBlur = () => {
        // Check if textboxRef.current is not null and update the content
        if (textboxRef.current) {
            updateContent(data.ID, textboxRef.current.innerText);
        }
    };

    const style: React.CSSProperties = {
        position: 'absolute',
        left: `${(data.y / 12) * containerDimensions.width}px`,
        top: `${(data.x / 16) * containerDimensions.height}px`,
        width: `${(data.w / 12) * containerDimensions.width}px`,
        height: `${(data.h / 16) * containerDimensions.height}px`,
        border: '3px double grey',
        padding: '10px',
        textAlign: 'left',
    };

    return (
        <div
            ref={textboxRef}
            style={style}
            contentEditable={true}
            onClick={handleClick}
            onBlur={handleBlur}
        ></div>
    );
};

export default Textbox;
