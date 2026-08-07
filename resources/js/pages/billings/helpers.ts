import { PaymentStatus } from './types';

export function money(value: number | string | null | undefined) {
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'PHP',
    }).format(Number(value ?? 0));
}

export function formatDate(value: string | null) {
    return value
        ? new Intl.DateTimeFormat(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
          }).format(new Date(value))
        : 'Not recorded';
}

export function statusVariant(status: PaymentStatus) {
    return status === 'Paid'
        ? 'default'
        : status === 'Cancelled'
          ? 'destructive'
          : 'secondary';
}
