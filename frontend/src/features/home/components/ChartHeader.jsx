import React, { useState } from "react";
import { useTheme } from "@/components/theme/ThemeWrapper";


export const ChartHeader = ({ title, children }) => {
    const { isNight } = useTheme();

    return (
        <div className="flex justify-between items-start mb-4 pt-4 pl-4 pr-2 gap-4"> 
            <div className="flex-1 font-bold text-gray-800 text-lg leading-tight">
                <h2 className={`font-extrabold transition-colors ${isNight ? "text-slate-200" : "text-slate-800"}`}>
                    {title}
                </h2>
            </div>
            <div className="shrink-0 flex justify-end items-center gap-3">
                {children}
            </div>
        </div>
    )
}