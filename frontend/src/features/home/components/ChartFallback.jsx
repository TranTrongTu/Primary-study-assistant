import React from 'react';
import { CloudSlashIcon, TrayIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { useTheme } from "@/components/theme/ThemeWrapper";
import { getSidebarCardClasses } from '../utils/dropdownColor';

export const ChartFallback = ({ error }) => {
    const { isNight } = useTheme();
    const sidebarCardCls = getSidebarCardClasses(isNight);

    // 1. Trạng thái server sập (Lỗi 400, 500)
    if (error.type === 'MAINTENANCE') {
        return (
            <div className={`flex flex-col items-center justify-center text-center px-6 py-10 rounded-[1.5rem] shadow-sm border-2 transition-all ${sidebarCardCls}`}>
                <CloudSlashIcon size={48} className="text-slate-300 mb-3" weight="duotone" />
                <p className={`text-lg font-bold ${isNight ? "text-slate-200" : "text-slate-800"}`}>
                    {error.message}
                </p>
            </div>
        );
    }

    // 2. Fallback chung cho các lỗi không xác định
    return (
        <div className="w-full h-full min-h-[250px] flex flex-col items-center justify-center text-center p-4">
            <WarningCircleIcon size={40} className="text-orange-400 mb-2" />
            <p className="text-sm text-slate-600">{error.message}</p>
        </div>
    );
};