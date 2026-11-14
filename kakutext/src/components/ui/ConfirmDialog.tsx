import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog isOpen={isOpen} title={title} description={description} onClose={onClose}>
      <div className="mt-4 flex flex-col-reverse justify-end gap-2 sm:flex-row">
        <Button type="button" variant="secondary" disabled={isLoading} onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button type="button" variant={variant} isLoading={isLoading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}