
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
        if (!aiAvailable) return;
        setIsPressing(true);
        isLongPressTriggered.current = false;
        startPos.current = { x: e.clientX, y: e.clientY };
        
        // Clear any existing timer just in case
        if (pressTimer.current) clearTimeout(pressTimer.current);

        // Increased timeout to 700ms to avoid accidental triggering during scroll
        pressTimer.current = window.setTimeout(() => {
            onLongPress();
            isLongPressTriggered.current = true;
            setIsPressing(false); 
            // Haptic feedback
            if (navigator.vibrate) navigator.vibrate(50);
        }, 700);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (pressTimer.current) {
            const moveX = Math.abs(e.clientX - startPos.current.x);
            const moveY = Math.abs(e.clientY - startPos.current.y);
            // Reduced threshold to 10px so scrolling cancels the long press faster
            if (moveX > 10 || moveY > 10) {
                clearTimeout(pressTimer.current);
                pressTimer.current = undefined;
                setIsPressing(false);
            }
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsPressing(false);
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = undefined;
        }
    };
    
    const handlePointerLeave = () => {
        setIsPressing(false);
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = undefined;
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        // If long press was triggered, don't fire click
        if (isLongPressTriggered.current) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        if (aiAvailable) {
            onClick();
        }
    };

    return (
        <button
            onClick={handleClick}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onContextMenu={(e) => e.preventDefault()}
            className={`w-16 h-16 bg-primary text-white rounded-2xl shadow-lg flex items-center justify-center
                       transform transition-all duration-200 ease-in-out hover:shadow-xl focus:outline-none
                       ${isPressing ? 'scale-95 bg-primary-dark' : 'scale-100 hover:scale-105'}
                       disabled:bg-slate-400 disabled:dark:bg-slate-600 disabled:cursor-not-allowed disabled:scale-100 touch-none select-none overflow-hidden p-3`}
            style={{ touchAction: 'none' }} 
            aria-label={t('assistantFabTooltip')}
            title={aiAvailable ? t('assistantFabTooltip') : t('aiUnavailableShort')}
            disabled={!aiAvailable}
        >
            <div className="w-8 h-8">
                <AssistantIcon />
            </div>
        </button>
    );
};

export default FloatingAssistantButton;
