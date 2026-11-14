import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { useCreateFolder, useUpdateFolder } from '@/hooks/useFolders';
import { cn } from '@/lib/cn';
import { createFolderSchema, type CreateFolderInput } from '@/lib/validation';
import type { Folder } from '@/stores/useAppStore';

const FOLDER_COLOR_SWATCHES: { label: string; value: string | null }[] = [
  { label: 'Default Honey', value: null },
  { label: 'Apricot', value: '#F4A84E' },
  { label: 'Peach Blossom', value: '#F29A68' },
  { label: 'Butter Cream', value: '#E8C568' },
  { label: 'Sage Leaf', value: '#8BB88E' },
  { label: 'Sky Mist', value: '#82B1D6' },
  { label: 'Lavender', value: '#B59AD8' },
];

export interface FolderModalProps {
  isOpen: boolean;
  editingFolder?: Folder | null;
  onClose: () => void;
}

export function FolderModal({ isOpen, editingFolder = null, onClose }: FolderModalProps) {
  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const { showToast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateFolderInput>({
    resolver: zodResolver(createFolderSchema),
    defaultValues: {
      name: '',
      color: null,
    },
  });

  const selectedColor = watch('color') ?? null;

  useEffect(() => {
    if (!isOpen) return;
    setServerError(null);
    reset({
      name: editingFolder?.name ?? '',
      color: editingFolder?.color ?? null,
    });
  }, [isOpen, editingFolder, reset]);

  const onSubmit = async (values: CreateFolderInput) => {
    setServerError(null);
    try {
      if (editingFolder) {
        await updateFolder.mutateAsync({
          id: editingFolder.id,
          name: values.name,
          color: values.color ?? null,
        });
        showToast('Folder updated!', 'success');
      } else {
        await createFolder.mutateAsync({
          name: values.name,
          color: values.color ?? null,
        });
        showToast('Folder created!', 'success');
      }
      onClose();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Could not save folder.');
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      title={editingFolder ? 'Edit Folder' : 'New Folder'}
      description="Organize your notes into color-tagged folders."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-3 space-y-4">
        {serverError && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-card border-[1.5px] border-danger-text bg-danger/20 px-3 py-2 text-xs font-bold text-danger-text"
          >
            {serverError}
          </div>
        )}

        <TextField
          label="Folder name"
          placeholder="e.g., Study Notes, Recipes, Journal"
          maxLength={50}
          autoFocus
          error={errors.name?.message}
          {...register('name')}
        />

        <div className="space-y-2">
          <span id="folder-color-label" className="block text-sm font-extrabold text-ink">
            Folder tag color
          </span>
          <div
            role="radiogroup"
            aria-labelledby="folder-color-label"
            className="flex flex-wrap items-center gap-2"
          >
            {FOLDER_COLOR_SWATCHES.map((swatch) => {
              const isSelected = selectedColor === swatch.value;
              return (
                <button
                  key={swatch.label}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={swatch.label}
                  onClick={() => setValue('color', swatch.value, { shouldDirty: true })}
                  className={cn(
                    'flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full border-[1.5px] transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
                    isSelected ? 'border-ink ring-2 ring-ink/30' : 'border-line'
                  )}
                  style={{ backgroundColor: swatch.value || 'var(--accent-primary)' }}
                >
                  {isSelected && <Check className="h-4 w-4 text-accent-fg" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col-reverse justify-end gap-2 pt-2 sm:flex-row">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {editingFolder ? 'Save Changes' : 'Create Folder'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}