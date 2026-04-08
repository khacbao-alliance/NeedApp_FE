'use client';

import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { Button } from './Button';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
}

const variantConfig: Record<
  ConfirmVariant,
  { icon: string; iconBg: string; iconColor: string; btnVariant: 'danger' | 'primary' | 'secondary' }
> = {
  danger: {
    icon: '!',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-400',
    btnVariant: 'danger',
  },
  warning: {
    icon: '!',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    btnVariant: 'primary',
  },
  info: {
    icon: 'i',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    btnVariant: 'primary',
  },
};

export function ConfirmModal({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  loading = false,
}: ConfirmModalProps) {
  const { t } = useTranslation();
  const config = variantConfig[variant];

  return (
    <Modal open={open} onClose={onCancel} size="sm">
      <div className="flex flex-col items-center text-center gap-4 pt-2">
        {/* Icon */}
        <div
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-2xl',
            config.iconBg
          )}
        >
          <ExclamationTriangleIcon className={cn('h-7 w-7', config.iconColor)} />
        </div>

        {/* Text */}
        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-[var(--foreground)]">{title}</h3>
          {description && (
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">{description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex w-full gap-3 pt-1">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel ?? t('common.cancel')}
          </Button>
          <Button
            variant={config.btnVariant}
            className={cn(
              'flex-1',
              variant === 'danger' &&
                'bg-red-500 text-white hover:bg-red-600 border-0 shadow-lg shadow-red-500/20'
            )}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel ?? t('common.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
