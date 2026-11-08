import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useTheme } from "@/components/theme/ThemeWrapper";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";

export const FormatColumn = ({data, isAnimationActive}) => {
    const { isNight } = useTheme();

    const textColor = isNight ? '#e2e8f0' : '#374151'; // e2e8f0 là slate-200, 374151 là gray-700
    const gridColor = isNight ? '#475569' : '#414650'; // Màu của lưới nhện


    const chartConfig = {
        count: {
            label: "Số lượng bài nộp",
            color: "#8884d8",      
        },
    };

    return (
        <ChartContainer config={chartConfig} className="w-full aspect-square">
            <BarChart data={data} margin={{ top: 5, right: 30, bottom: 5 }}>
                <XAxis dataKey="label" tick={{ fill: textColor }} />
                <YAxis tick={{ fill: textColor }} />
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <Bar 
                    dataKey="count" 
                    fill="var(--color-count)" 
                    radius={[10, 10, 0, 0]} 
                    isAnimationActive={isAnimationActive} 
                />
                <ChartTooltip 
                    cursor={false} 
                    isAnimationActive={false}
                    content={
                        <ChartTooltipContent 
                            className={isNight ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}
                            formatter={(value, name) => (
                                <div className={`flex items-center gap-2 ${isNight ? "text-slate-200" : "text-slate-700"}`}>
                                    
                                    {/* 1. TỰ TAY VẼ CỤC MÀU: Lấy đúng màu tím từ config */}
                                    <div 
                                        className="h-2.5 w-2.5 shrink-0 rounded-[2px]" 
                                        style={{ backgroundColor: chartConfig[name]?.color || "#8884d8" }} 
                                    />
                                    
                                    {/* 2. CHỮ VÀ SỐ: Gói vào một div có gap-1.5 để luôn có khoảng cách đẹp mắt */}
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-medium">{chartConfig[name]?.label || name}:</span>
                                        <span className="font-bold">{value}</span>
                                    </div>
                                    
                                </div>
                            )}
                        />
                    }
                />
                {/* <Legend /> */}
            </BarChart>
        </ChartContainer>
    
    
  );
}