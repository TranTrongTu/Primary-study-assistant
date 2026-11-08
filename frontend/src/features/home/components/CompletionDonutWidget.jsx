import React from "react";
import { useState } from "react";

import { ChartHeader } from "./ChartHeader";
import { CompletionDonut } from "./CompletionDonut";

import { PieChartComponent } from "./PieChart";

import { CaretDownIcon } from '@phosphor-icons/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import { useCompletionRateChart } from "../hooks/useCompletionRateChart";

import { useTheme } from "@/components/theme/ThemeWrapper";
import { getDropdownClasses } from "../utils/dropdownColor";

import { ChartFallback } from "./ChartFallback";

export const CompletionDonutWidget = () => {
    const [filterValue, setFilterValue] = useState("7 ngày");
    const { data: pieData, isLoading, error } = useCompletionRateChart(filterValue);

    const { isNight } = useTheme();
    const { btnCls, contentCls, itemCls } = getDropdownClasses(isNight);

    const filterOptions = ["1 ngày", "7 ngày", "30 ngày", "60 ngày", "90 ngày"];

    return (
        <div className="w-full h-full flex flex-col">
            <ChartHeader title="Tỉ lệ hoàn thành bài tập" >
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        {/* 4a. Gắn class cho Nút bấm */}
                        <Button 
                            variant="outline" 
                            className={`flex items-center gap-2 h-8 px-3 text-sm transition-colors ${btnCls}`}
                        >
                            {filterValue}
                            <CaretDownIcon weight="bold" />
                        </Button>
                    </DropdownMenuTrigger>
                    
                    {/* 4b. Gắn class cho Khung menu */}
                    <DropdownMenuContent align="end" className={contentCls}>
                        
                        {/* 4c. Map mảng và gắn class cho từng Item */}
                        {filterOptions.map(option => (
                            <DropdownMenuItem 
                                key={option}
                                onClick={() => setFilterValue(option)}
                                className={itemCls}
                            >
                                {option}
                            </DropdownMenuItem>
                        ))}
                        
                    </DropdownMenuContent>
                </DropdownMenu>
            </ChartHeader>

            {/* <CompletionDonut data={pieData} /> */}
            <div className="flex-1 w-full h-full flex items-center justify-center p-4 relative">
                {/* 1. Trạng thái Loading */}
                {isLoading && (
                    <div className="text-slate-400 text-sm animate-pulse">Đang tải dữ liệu...</div>
                )}
                
                {/* 2. Trạng thái Lỗi / Trống */}
                {!isLoading && error && (
                    <ChartFallback error={error} />
                )}

                {/* 3. Trạng thái Thành công (Render Biểu đồ) */}
                {!isLoading && !error && pieData && (
                    <PieChartComponent data={pieData} />
                )}
            </div>
        </div>
    )
}