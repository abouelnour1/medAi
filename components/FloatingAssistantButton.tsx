
import React, { useRef, useState } from 'react';
import { TFunction, Language } from '../types';
import { isAIAvailable } from '../geminiService';
import AssistantIcon from './icons/AssistantIcon';

interface FloatingAssistantButtonProps {
    onClick: () => void;
    onLongPress: () => void;
    t: TFunction;
    language: Language;
}

const FloatingAssistantButton: React.FC<FloatingAssistantButtonProps> = ({ onClick, onLongPress, t, language }) => {
    const [isPressing, setIsPressing] = useState(false);
    const aiAvailable = isAIAvailable();

    return (
        <button
            onPointerDown={() => setIsPressing(true)}
            onPointerUp={() => setIsPressing(false)}
            onPointerLeave={() => setIsPressing(false)}
            onClick={onClick}
            className={`w-16 h-16 bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl shadow-[0_8px_20px_-5px_rgba(20,184,166,0.6)] flex items-center justify-center
                       transform transition-all duration-200 active:scale-90 active:shadow-inner
                       ${!aiAvailable ? 'grayscale opacity-70' : 'animate-bounce-subtle'} 
                       touch-none select-none overflow-hidden relative group`}
        >
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
            
            <div className={`w-8 h-8 transition-transform group-hover:scale-110 group-hover:rotate-12`}>
                <AssistantIcon />
            </div>
            
            {/* Pulsing indicator */}
            <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white shadow-sm"></div>
        </button>
    );
};

export default FloatingAssistantButton;
