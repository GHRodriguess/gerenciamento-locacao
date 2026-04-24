import React, { useEffect } from "react";

const Toast = ({
    message,
    type = "success",
    isOpen,
    onClose,
    duration = 3000,
}) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose, duration]);

    if (!isOpen) return null;

    const bgColors = {
        success: "bg-emerald-600",
        error: "bg-red-600",
        info: "bg-indigo-600",
    };

    return (
        <div className="fixed bottom-10 left-1/2 z-100  animate-slide-up">
            <div
                className={`${bgColors[type]} text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 min-w-75 justify-center`}
            >
                {type === "error" && <span>⚠️</span>}
                <p className="font-semibold">{message}</p>
                <button
                    onClick={onClose}
                    className="ml-auto opacity-70 hover:opacity-100"
                >
                    ✕
                </button>
            </div>
        </div>
    );
};

export default Toast;
