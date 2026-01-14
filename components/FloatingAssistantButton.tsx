
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
    const pressTimer = useRef<number | undefined>(undefined);
    const startPos = useRef({ x: 0, y: 0 });
    const isLongPressTriggered = useRef(false);
    const aiAvailable = isAIAvailable();

    const handlePointerDown = (e: React.PointerEvent) => {
        setIsPressing(true);
        isLongPressTriggered.current = false;
        startPos.current = { x: e.clientX, y: e.clientY };
        
        if (pressTimer.current) clearTimeout(pressTimer.current);

        pressTimer.current = window.setTimeout(() => {
            if (aiAvailable) {
                if (navigator.vibrate) navigator.vibrate([60]);
                onLongPress();
                isLongPressTriggered.current = true;
            }
            setIsPressing(false);
        }, 600);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (pressTimer.current) {
            const moveX = Math.abs(e.clientX - startPos.current.x);
            const moveY = Math.abs(e.clientY - startPos.current.y);
            if (moveX > 25 || moveY > 25) {
                clearTimeout(pressTimer.current);
                pressTimer.current = undefined;
                setIsPressing(false);
            }
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = undefined;
        }
        
        if (isPressing && !isLongPressTriggered.current) {
            if (!aiAvailable) {
                alert(t('aiKeyMissingInstruction'));
            } else {
                onClick();
            }
        }
        
        setIsPressing(false);
    };
    
    const handlePointerLeave = () => {
        setIsPressing(false);
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = undefined;
        }
    };

    return (
        <button
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onContextMenu={(e) => e.preventDefault()}
            className={`w-16 h-16 bg-primary text-white rounded-2xl shadow-xl flex items-center justify-center
                       transform transition-all duration-200 ease-in-out
                       ${isPressing ? 'scale-90 bg-primary-dark shadow-inner brightness-90' : 'scale-100 hover:scale-105 opacity-90 hover:opacity-100'}
                       ${!aiAvailable ? 'grayscale-[0.5] opacity-70' : 'animate-bounce-subtle'} 
                       touch-none select-none overflow-hidden p-3`}
            style={{ touchAction: 'none' }} 
            aria-label={t('assistantFabTooltip')}
        >
            <div className={`w-8 h-8 transition-transform ${isPressing ? 'scale-110 rotate-12' : ''}`}>
                <AssistantIcon />
            </div>
            
            {isPressing && aiAvailable && (
                <div className="absolute inset-0 border-4 border-white/30 rounded-2xl animate-ping pointer-events-none"></div>
            )}
        </button>
    );
};

export default FloatingAssistantButton;
