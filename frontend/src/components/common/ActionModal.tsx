import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

const ACTION_MODAL_TEXT = {
  Confirmer: { en: "Confirm", ar: "تأكيد", es: "Confirmar" },
  Annuler: { en: "Cancel", ar: "إلغاء", es: "Cancelar" },
} satisfies PageTextDict;

export function ActionModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onConfirm,
  singleAction = false,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;

  singleAction?: boolean;
  children?: ReactNode;
}) {
  const { tt } = usePageText(ACTION_MODAL_TEXT);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-bold">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="text-[13.5px]">{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        {children ? <div className="py-2">{children}</div> : null}

        <DialogFooter className="gap-2 sm:gap-2">
          {singleAction ? null : (
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md border border-border px-4 py-2 text-[13.5px] font-semibold transition-colors hover:bg-accent"
            >
              {tt(cancelLabel)}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-primary px-4 py-2 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {tt(confirmLabel)}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
