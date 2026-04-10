import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ConfirmationDialogAction = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
};

type ConfirmationDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmAction: ConfirmationDialogAction;
  cancelAction?: ConfirmationDialogAction;
  secondaryAction?: ConfirmationDialogAction;
};

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmAction,
  cancelAction,
  secondaryAction,
}: ConfirmationDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        cancelAction?.onClick();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [cancelAction, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-[rgba(15,23,42,0.44)] p-3 backdrop-blur-[6px] sm:items-center sm:p-6">
      <Card className="app-confirmation-dialog w-full max-w-[32rem] rounded-[28px] p-0 sm:rounded-[32px]">
        <div className="space-y-4 p-5 sm:p-7">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-[18px] bg-rose-50 text-rose-600 shadow-[0_10px_24px_rgba(244,63,94,0.12)]">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.9"
              viewBox="0 0 24 24"
            >
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.3 3.8 2.9 16.3A1.9 1.9 0 0 0 4.5 19h15a1.9 1.9 0 0 0 1.6-2.7L13.7 3.8a1.9 1.9 0 0 0-3.4 0Z" />
            </svg>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold tracking-[-0.03em] text-ink sm:text-2xl">{title}</h3>
            <p className="text-sm leading-6 text-slate-500 sm:text-[0.95rem]">{description}</p>
          </div>

          <div className="grid gap-3 pt-1 sm:grid-cols-3">
            {cancelAction ? (
              <Button
                className="w-full"
                disabled={cancelAction.disabled}
                onClick={cancelAction.onClick}
                type="button"
                variant={cancelAction.variant ?? "secondary"}
              >
                {cancelAction.label}
              </Button>
            ) : null}

            {secondaryAction ? (
              <Button
                className="w-full"
                disabled={secondaryAction.disabled}
                onClick={secondaryAction.onClick}
                type="button"
                variant={secondaryAction.variant ?? "ghost"}
              >
                {secondaryAction.label}
              </Button>
            ) : null}

            <Button
              className="w-full"
              disabled={confirmAction.disabled}
              onClick={confirmAction.onClick}
              type="button"
              variant={confirmAction.variant ?? "danger"}
            >
              {confirmAction.label}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
