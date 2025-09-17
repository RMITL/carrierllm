import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@carrierllm/ui';
import { submitOrionIntake } from '../lib/api';
const chatFlow = [
    {
        question: "Hi! I'm here to help you find the perfect insurance carrier for your client. Let's start with some basic information. What's your client's age?",
        field: 'age',
        type: 'number',
        validation: (value) => {
            const age = Number(value);
            if (age < 18 || age > 85)
                return 'Age must be between 18 and 85';
            return null;
        }
    },
    {
        question: "Great! What state does your client live in? (Please provide the 2-letter abbreviation, like CA or NY)",
        field: 'state',
        type: 'text',
        validation: (value) => {
            if (value.length !== 2)
                return 'Please provide a 2-letter state abbreviation';
            return null;
        }
    },
    {
        question: "Thanks! Now I need to know your client's height in inches. For example, 5'10\" would be 70 inches.",
        field: 'height',
        type: 'number',
        validation: (value) => {
            const height = Number(value);
            if (height < 48 || height > 90)
                return 'Height must be between 48 and 90 inches';
            return null;
        }
    },
    {
        question: "Perfect! What's your client's weight in pounds?",
        field: 'weight',
        type: 'number',
        validation: (value) => {
            const weight = Number(value);
            if (weight < 70 || weight > 400)
                return 'Weight must be between 70 and 400 pounds';
            return null;
        }
    },
    {
        question: "Has your client used any nicotine products in the last 24 months? Please respond with: never, past24months, or current",
        field: 'nicotine.lastUse',
        type: 'select',
        options: ['never', 'past24months', 'current'],
        validation: (value) => {
            if (!['never', 'past24months', 'current'].includes(value)) {
                return 'Please respond with: never, past24months, or current';
            }
            return null;
        }
    },
    {
        question: "How about marijuana use? Please respond with: never, past12months, or current",
        field: 'marijuana.lastUse',
        type: 'select',
        options: ['never', 'past12months', 'current'],
        validation: (value) => {
            if (!['never', 'past12months', 'current'].includes(value)) {
                return 'Please respond with: never, past12months, or current';
            }
            return null;
        }
    },
    {
        question: "Does your client have any cardiac history (heart attack, stents, angina, heart failure)? Please respond with: yes or no",
        field: 'cardiac.hasHistory',
        type: 'boolean',
        validation: (value) => {
            if (!['yes', 'no'].includes(value.toLowerCase())) {
                return 'Please respond with: yes or no';
            }
            return null;
        }
    },
    {
        question: "Does your client have diabetes (Type 1 or Type 2)? Please respond with: yes or no",
        field: 'diabetes.hasCondition',
        type: 'boolean',
        validation: (value) => {
            if (!['yes', 'no'].includes(value.toLowerCase())) {
                return 'Please respond with: yes or no';
            }
            return null;
        }
    },
    {
        question: "Does your client have any cancer history? Please respond with: yes or no",
        field: 'cancer.hasHistory',
        type: 'boolean',
        validation: (value) => {
            if (!['yes', 'no'].includes(value.toLowerCase())) {
                return 'Please respond with: yes or no';
            }
            return null;
        }
    },
    {
        question: "How much life insurance coverage is your client looking for? Please enter the amount in dollars (e.g., 500000 for $500,000)",
        field: 'coverageTarget.amount',
        type: 'number',
        validation: (value) => {
            const amount = Number(value);
            if (amount < 50000)
                return 'Minimum coverage amount is $50,000';
            return null;
        }
    },
    {
        question: "What type of coverage are they interested in? Please respond with: iul (Indexed Universal Life), term (Term Life), or annuity",
        field: 'coverageTarget.type',
        type: 'select',
        options: ['iul', 'term', 'annuity'],
        validation: (value) => {
            if (!['iul', 'term', 'annuity'].includes(value.toLowerCase())) {
                return 'Please respond with: iul, term, or annuity';
            }
            return null;
        }
    }
];
export const ChatPage = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        {
            id: '1',
            type: 'assistant',
            content: chatFlow[0].question,
            timestamp: new Date()
        }
    ]);
    const [chatState, setChatState] = useState({
        currentStep: 0,
        isComplete: false,
        intake: {}
    });
    const [currentInput, setCurrentInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const { mutateAsync, isPending } = useMutation({
        mutationFn: submitOrionIntake,
        onSuccess: (data) => {
            navigate(`/results/${data.recommendationId}`, { state: data });
        }
    });
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    const setNestedValue = (obj, path, value) => {
        const keys = path.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in current)) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
    };
    const handleSendMessage = async () => {
        if (!currentInput.trim() || isPending)
            return;
        const userMessage = {
            id: Date.now().toString(),
            type: 'user',
            content: currentInput.trim(),
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        const currentStep = chatFlow[chatState.currentStep];
        const validation = currentStep.validation(currentInput.trim());
        if (validation) {
            // Show error message
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: `${validation}. ${currentStep.question}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            setCurrentInput('');
            return;
        }
        // Process the valid input
        let processedValue = currentInput.trim();
        if (currentStep.type === 'number') {
            processedValue = Number(processedValue);
        }
        else if (currentStep.type === 'boolean') {
            processedValue = processedValue.toLowerCase() === 'yes';
        }
        else if (currentStep.type === 'text' && currentStep.field === 'state') {
            processedValue = processedValue.toUpperCase();
        }
        const updatedIntake = { ...chatState.intake };
        setNestedValue(updatedIntake, currentStep.field, processedValue);
        const nextStep = chatState.currentStep + 1;
        if (nextStep >= chatFlow.length) {
            // Chat complete, submit intake
            setChatState(prev => ({ ...prev, isComplete: true, intake: updatedIntake }));
            setIsTyping(true);
            setTimeout(() => {
                setIsTyping(false);
                const completeMessage = {
                    id: (Date.now() + 2).toString(),
                    type: 'assistant',
                    content: "Perfect! I have all the information I need. Let me find the best carrier recommendations for your client...",
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, completeMessage]);
                // Submit the intake
                const orionIntake = {
                    core: updatedIntake,
                    validated: true,
                    tier2Triggered: false // For now, we'll set this to false in chat mode
                };
                mutateAsync(orionIntake);
            }, 1000);
        }
        else {
            // Continue to next question
            setChatState(prev => ({ ...prev, currentStep: nextStep, intake: updatedIntake }));
            setIsTyping(true);
            setTimeout(() => {
                setIsTyping(false);
                const nextMessage = {
                    id: (Date.now() + 2).toString(),
                    type: 'assistant',
                    content: chatFlow[nextStep].question,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, nextMessage]);
            }, 800);
        }
        setCurrentInput('');
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    return (_jsx("div", { className: "max-w-4xl mx-auto h-[calc(100vh-12rem)]", children: _jsxs(Card, { className: "h-full flex flex-col", children: [_jsxs("div", { className: "border-b border-gray-200 p-4", children: [_jsx("h1", { className: "text-xl font-semibold text-gray-900", children: "Chat Intake" }), _jsx("p", { className: "text-sm text-gray-600", children: "I'll ask you a series of questions to gather the information needed for carrier recommendations." })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: [messages.map((message) => (_jsx("div", { className: `flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`, children: _jsxs("div", { className: `max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.type === 'user'
                                    ? 'bg-[color:var(--color-primary)] text-white'
                                    : 'bg-gray-100 text-gray-900'}`, children: [_jsx("p", { className: "text-sm", children: message.content }), _jsx("p", { className: `text-xs mt-1 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`, children: formatTime(message.timestamp) })] }) }, message.id))), isTyping && (_jsx("div", { className: "flex justify-start", children: _jsx("div", { className: "bg-gray-100 text-gray-900 px-4 py-2 rounded-lg", children: _jsxs("div", { className: "flex space-x-1", children: [_jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce" }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0.1s' } }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0.2s' } })] }) }) })), _jsx("div", { ref: messagesEndRef })] }), _jsxs("div", { className: "border-t border-gray-200 p-4", children: [_jsxs("div", { className: "flex space-x-2", children: [_jsx("input", { type: "text", value: currentInput, onChange: (e) => setCurrentInput(e.target.value), onKeyPress: handleKeyPress, placeholder: "Type your response...", disabled: isPending || chatState.isComplete || isTyping, className: "flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent" }), _jsx(Button, { onClick: handleSendMessage, disabled: !currentInput.trim() || isPending || chatState.isComplete || isTyping, children: isPending ? 'Processing...' : 'Send' })] }), chatFlow[chatState.currentStep]?.options && (_jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: chatFlow[chatState.currentStep].options?.map((option) => (_jsx(Button, { variant: "secondary", size: "sm", onClick: () => {
                                    setCurrentInput(option);
                                }, disabled: isPending || chatState.isComplete || isTyping, children: option }, option))) }))] })] }) }));
};
