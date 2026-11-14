import { useEffect, useRef, type KeyboardEvent } from 'react';
import { EditorContent, type Editor } from '@tiptap/react';
import { KakuMascot } from '@/components/mascot/KakuMascot';
import { MAX_NOTE_TITLE_LENGTH } from '@/lib/validation';
import { useAppStore } from '@/stores/useAppStore';

export interface PaperCanvasProps {
  editor: Editor | null;
  title: string;
  onTitleChange: (nextTitle: string) => void;
  onTitleBlur?: () => void;
  disabled?: boolean;
}

export function PaperCanvas({
  editor,
  title,
  onTitleChange,
  onTitleBlur,
  disabled = false,
}: PaperCanvasProps) {
  const mascotMood = useAppStore((s) => s.mascotMood);
  const titleRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [title]);

  const handleTitleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      editor?.chain().focus('start').run();
    }
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-3 py-4 sm:px-6 sm:py-5">
      <div className="relative flex flex-1 flex-col rounded-paper border-[1.5px] border-ink bg-paper p-3 shadow-paper sm:p-5">
        <div className="relative flex flex-1 flex-col rounded-card border-2 border-dashed border-(--border-dashed) px-4 pt-4 pb-16 sm:px-7 sm:pt-6 sm:pb-20">
          <textarea
            ref={titleRef}
            rows={1}
            value={title}
            disabled={disabled}
            maxLength={MAX_NOTE_TITLE_LENGTH}
            aria-label="Note title"
            placeholder="Untitled Cozy Note..."
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={onTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className="mb-3 w-full resize-none overflow-hidden border-b border-line/50 bg-transparent pb-2 text-2xl font-black tracking-tight text-ink placeholder:text-muted/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink sm:text-3xl"
          />

          <div className="flex-1">
            <EditorContent editor={editor} />
          </div>

          <div className="pointer-events-none absolute right-3 bottom-3 select-none opacity-95">
            <KakuMascot mood={mascotMood} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}