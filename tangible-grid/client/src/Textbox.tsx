import React, { useRef, useEffect } from 'react';

/* ------------------------------------------------------------- Interfaces ------------------------------------------------------------- */

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
    onFocus: () => void;
    onBlur: () => void;
    containerDimensions: {
        width: number;
        height: number;
    };
    updateContent: (id: string, content: string) => void;
}

const Textbox: React.FC<TextboxProps> = ({ data, isActive, setActiveTextboxId, containerDimensions, updateContent, onFocus, onBlur }) => {

    /* ------------------------------------------------------------- useRefs ------------------------------------------------------------- */

    // Explicitly typing the ref as HTMLDivElement
    const textboxRef = useRef<HTMLDivElement>(null);

    /* ------------------------------------------------------------- Functions ------------------------------------------------------------- */

    // Sets a textbox active when it gets clicked
    const handleClick = () => {
        setActiveTextboxId(data.id);
        onFocus();
    };

    // Intended to trigger an action when the Textbox loses focus
    const handleBlur = () => {
        // Check if textboxRef.current is not null and update the content
        if (textboxRef.current) {
            updateContent(data.id.toString(), textboxRef.current.innerHTML);
        }
        onBlur();
    };

    /* ------------------------------------------------------------- useEffects ------------------------------------------------------------- */

    // Focus the textbox when it becomes active
    useEffect(() => {
        if (isActive && textboxRef.current) {
            textboxRef.current.focus();
        }
    }, [isActive]);

    // Update the content when data.content changes
    useEffect(() => {
        if (textboxRef.current) {
            textboxRef.current.innerHTML = data.content;
        }
    }, [data.content]);

    /* ------------------------------------------------------------- Style ------------------------------------------------------------- */

    const style: React.CSSProperties = {
        position: 'absolute',
        left: `${(((data.top_left_col) / 12) * containerDimensions.width) + 10}px`,
        top: `${(((data.top_left_row) / 16) * containerDimensions.height) + 10}px`,
        width: `${(((data.width + 1) / 12) * containerDimensions.width) - 20}px`,
        height: `${(((data.length + 1) / 16) * containerDimensions.height) - 20}px`,
        border: '3px double grey',
        textAlign: 'left',
        backgroundColor: '#FAF9F6',
        borderRadius: '10px',
        fontSize: '40px',
        overflow: 'auto', // Enable scrolling when text overflows
        wordWrap: 'break-word', // Ensure long words wrap correctly
        whiteSpace: 'pre-wrap', // Preserve formatting and wrap text
    };

    return (
        <div
            ref={textboxRef}
            style={style}
            contentEditable={true}
            onClick={handleClick}
            onBlur={handleBlur}
            data-id={data.id}
        ></div>
    );
};

export default Textbox;
