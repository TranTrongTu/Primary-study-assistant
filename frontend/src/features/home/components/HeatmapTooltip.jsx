import React from 'react';
import { createPortal } from 'react-dom';

export const HeatmapTooltip = ({ tooltipData, isNight }) => {
    // Không có data hoặc đang render phía server thì không vẽ gì cả
    if (!tooltipData || typeof document === 'undefined') return null;

    return createPortal(
        <div 
            className="fixed z-[9999] pointer-events-none transform -translate-x-1/2 -translate-y-full pb-2"
            style={{ 
                left: tooltipData.x, 
                top: tooltipData.y,
                transition: 'left 0.1s ease-out, top 0.1s ease-out'
            }}
        >
            <div className={`px-3 py-2 rounded-md shadow-md border text-sm ${isNight ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-gray-200 text-slate-700"}`}>
                <div className="font-medium mb-1 border-b pb-1 border-gray-500/30">
                    {tooltipData.date}
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <div 
                        className="w-2.5 h-2.5 rounded-sm" 
                        style={{ backgroundColor: tooltipData.fill }} 
                    />
                    <span>Hoạt động: <span className="font-bold">{tooltipData.count}</span></span>
                </div>
            </div>
        </div>,
        document.body 
    );
};