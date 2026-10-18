'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const UiContext = createContext(null);

// Toast notifications and a promise based confirm dialog.
export function UiProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const [dialog, setDialog] = useState(null);
    const nextId = useRef(0);

    const toast = useCallback((message, type) => {
        const id = ++nextId.current;
        setToasts((list) => [...list, { id, message, type }]);
        setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 4000);
    }, []);

    const confirm = useCallback(
        ({ title, message, confirmLabel = 'Delete' }) =>
            new Promise((resolve) => setDialog({ title, message, confirmLabel, resolve })),
        []
    );

    const close = useCallback(
        (answer) => {
            dialog?.resolve(answer);
            setDialog(null);
        },
        [dialog]
    );

    return (
        <UiContext.Provider value={{ toast, confirm }}>
            {children}
            <div className="toasts" aria-live="polite">
                {toasts.map((t) => (
                    <div key={t.id} className={'toast' + (t.type ? ' ' + t.type : '')}>
                        {t.message}
                    </div>
                ))}
            </div>
            {dialog && <ConfirmDialog dialog={dialog} onClose={close} />}
        </UiContext.Provider>
    );
}

function ConfirmDialog({ dialog, onClose }) {
    const confirmButton = useRef(null);

    useEffect(() => {
        confirmButton.current?.focus();
        const onKey = (e) => {
            if (e.key === 'Escape') onClose(false);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div
            className="modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            onClick={(e) => e.target === e.currentTarget && onClose(false)}
        >
            <div className="modal">
                <h3 id="dialog-title">{dialog.title}</h3>
                <p>{dialog.message}</p>
                <div className="form-actions">
                    <button className="btn btn-outline" onClick={() => onClose(false)}>
                        Cancel
                    </button>
                    <button ref={confirmButton} className="btn btn-danger solid" onClick={() => onClose(true)}>
                        {dialog.confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function useUi() {
    return useContext(UiContext);
}
