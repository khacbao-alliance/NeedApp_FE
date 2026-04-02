'use client';

import type { FileAttachmentDto } from '@/types';
import { cn } from '@/lib/utils';
import {
  DocumentIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

interface FileAttachmentProps {
  file: FileAttachmentDto;
  isOwn?: boolean;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(contentType: string | null): boolean {
  return !!contentType?.startsWith('image/');
}

export function FileAttachment({ file, isOwn = false }: FileAttachmentProps) {
  if (isImage(file.contentType)) {
    return (
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden rounded-lg"
      >
        <img
          src={file.url}
          alt={file.fileName}
          className="max-h-48 w-auto rounded-lg object-cover transition-transform hover:scale-105"
        />
      </a>
    );
  }

  return (
    <a
      href={file.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-3 rounded-lg p-2.5 transition-colors',
        isOwn
          ? 'bg-white/10 hover:bg-white/20'
          : 'bg-[var(--surface-3)] hover:bg-[var(--surface-hover)]'
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
          isOwn ? 'bg-white/10' : 'bg-[var(--accent-indigo)]/10'
        )}
      >
        <DocumentIcon
          className={cn(
            'h-4 w-4',
            isOwn ? 'text-white/80' : 'text-[var(--accent-violet)]'
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-xs font-medium',
            isOwn ? 'text-white' : 'text-[var(--foreground)]'
          )}
        >
          {file.fileName}
        </p>
        <p
          className={cn(
            'text-[10px]',
            isOwn ? 'text-white/60' : 'text-[var(--text-muted)]'
          )}
        >
          {formatFileSize(file.fileSize)}
        </p>
      </div>
      <ArrowDownTrayIcon
        className={cn(
          'h-4 w-4 flex-shrink-0',
          isOwn ? 'text-white/60' : 'text-[var(--text-muted)]'
        )}
      />
    </a>
  );
}
