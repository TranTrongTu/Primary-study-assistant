import React from 'react';
import { useTheme } from './theme/ThemeWrapper';

/**
 * ErrorBanner — dùng chung cho tất cả tính năng
 *
 * Props:
 *   error      — null | { message: string, type: "error" | "warning" }
 *   onDismiss  — () => void   (bắt buộc nếu muốn có nút đóng)
 *   className  — string tùy chỉnh thêm nếu cần
 */
const ErrorBanner = ({ error, onDismiss, className = '' }) => {
    const { isNight } = useTheme();

    if (!error) return null;

    const message = typeof error === 'string' ? error : error.message;
    const type    = typeof error === 'object' ? error.type : 'error';

    const styles = {
        error: {
            light: 'border-red-300 bg-red-50 text-red-700',
            dark:  'border-red-400/30 bg-red-500/10 text-red-200',
            btn:   { light: 'bg-red-100 text-red-700', dark: 'bg-red-500/20 text-red-100' },
            icon:  '⚠️',
        },
        warning: {
            light: 'border-yellow-300 bg-yellow-50 text-yellow-700',
            dark:  'border-yellow-400/30 bg-yellow-500/10 text-yellow-200',
            btn:   { light: 'bg-yellow-100 text-yellow-700', dark: 'bg-yellow-500/20 text-yellow-100' },
            icon:  '⚡',
        },
    };

    const s = styles[type] ?? styles.error;

    return (
        <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${isNight ? s.dark : s.light} ${className}`}>
            <span className="mt-0.5 shrink-0 text-base">{s.icon}</span>
            <span className="flex-1 leading-snug">{message}</span>
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold transition-colors ${isNight ? s.btn.dark : s.btn.light}`}
                >
                    Đã hiểu
                </button>
            )}
        </div>
    );
};

export default ErrorBanner;