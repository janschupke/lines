"use client";

import React, { useEffect, useRef } from "react";
import { useDismissable } from "@/shared/hooks/useDismissable";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** The body copy. Say what is lost, in the player's terms. */
  children: React.ReactNode;
  /** The destructive choice — label it with its consequence, never "OK". */
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  testId?: string;
  cancelTestId?: string;
  confirmTestId?: string;
}

/**
 * The one confirmation surface. Escape and a click outside both resolve to
 * cancel — never to the destructive branch — and focus opens on the safe
 * button, so a stray Enter or Space keeps the game rather than ending it.
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  testId,
  cancelTestId,
  confirmTestId,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useDismissable(open, panelRef, onCancel);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="game-overlay absolute inset-0 bg-slate-800/95 rounded-xl z-50 p-6 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-testid={testId}
    >
      <div
        ref={panelRef}
        className="game-dialog p-5 max-w-sm text-game-text-secondary"
      >
        <h3 className="game-title text-xl mb-3">{title}</h3>
        {children}
        <div className="flex flex-col gap-2">
          <button
            ref={cancelRef}
            className="game-button game-button-primary px-4 py-2"
            data-testid={cancelTestId}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className="game-button game-button-accent px-4 py-2"
            data-testid={confirmTestId}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
