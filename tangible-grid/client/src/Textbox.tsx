import React, { useRef, useEffect } from 'react';

interface TextboxProps {
    data: {
        id: number;
        top_left_row: number;
        top_left_col: number;
        length: number;
        width: number;
        content: string;
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

    // Focus the textbox when it becomes active
    useEffect(() => {
        if (isActive && textboxRef.current) {
            textboxRef.current.focus();
        }
    }, [isActive]);

    useEffect(() => {
        if (textboxRef.current) {
            textboxRef.current.innerHTML = data.content;
        }
    }, [data.content]); // Update the content when data.content changes

    const handleClick = () => {
        setActiveTextboxId(data.id);
    };

    // intended to trigger an action when the Textbox loses focus
    const handleBlur = () => {
        // Check if textboxRef.current is not null and update the content
        if (textboxRef.current) {
            updateContent(data.id.toString(), textboxRef.current.innerHTML);
        }
    };

    const style: React.CSSProperties = {
        position: 'absolute',
        left: `${((data.top_left_col - 1) / 11) * containerDimensions.width}px`,
        top: `${((data.top_left_row - 1) / 15) * containerDimensions.height}px`,
        width: `${((data.width) / 12) * containerDimensions.width}px`,
        height: `${((data.length) / 16) * containerDimensions.height}px`,
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
