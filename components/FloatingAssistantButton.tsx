
import React, { useState } from 'react';
import { TFunction, Language } from '../types';
import { isAIAvailable } from '../geminiService';
import AssistantIcon from './icons/AssistantIcon';

interface FloatingAssistantButtonProps {
    onClick: () => void;
    onLongPress: () => void;
    t: TFunction;
    language: Language;
}

const FloatingAssistantButton: React.FC<FloatingAssistantButtonProps> = ({ onClick, t }) => {
    const aiAvailable = isAIAvailable();
    return (
        <div className="fixed bottom-[95px] ltr:right-4 rtl:left-4 z-50 pointer-events-none">
            <button
                onClick={onClick}
                className={`w-14 h-14 bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl shadow-xl flex items-center justify-center
                           transform transition-all active:scale-90 pointer-events-auto
                           ${!aiAvailable ? 'grayscale opacity-70' : 'animate-bounce-subtle'}`}
            >
                <div className="w-7 h-7"><AssistantIcon /></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"></div>
            </button>
        </div>
    );
};
export default FloatingAssistantButton;
