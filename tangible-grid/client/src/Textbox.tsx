import React, { useRef } from 'react';

interface TextboxProps {
    data: {
        id: number;
        top_left_row: number;
        top_left_col: number;
        length: number;
        width: number;
    };
    isActive: boolean;
    setActiveTextboxId: (id: number | null) => void;
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
        setActiveTextboxId(data.id);
    };

    // intended to trigger an action when the Textbox loses focus
    const handleBlur = () => {
        // Check if textboxRef.current is not null and update the content
        if (textboxRef.current) {
            updateContent(data.id.toString(), textboxRef.current.innerText);
        }
    };

    const style: React.CSSProperties = {
        position: 'absolute',
        left: `${(data.top_left_col / 12) * containerDimensions.width}px`,
        top: `${(data.top_left_row / 16) * containerDimensions.height}px`,
        width: `${(data.width / 12) * containerDimensions.width}px`,
        height: `${(data.length / 16) * containerDimensions.height}px`,
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
