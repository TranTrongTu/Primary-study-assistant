import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { useTheme } from "@/components/theme/ThemeWrapper";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";

export const FavoriteActivity = ({data, isAnimationActive}) => {
    const { isNight } = useTheme();

    const textColor = isNight ? '#e2e8f0' : '#374151';

    const chartConfig = {
        count: {
            label: "Số lượng hoạt động",
            color: "#8884d8",      
        },
    };

    return (
        <ChartContainer config={chartConfig} className="w-full aspect-square">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <XAxis type="number" tick={{ fill: textColor }} stroke="#e5e7eb" />
                <YAxis 
                    type="category" 
                    dataKey="label" 
                    tick={{ fill: textColor }} 
                    stroke="#e5e7eb"
                    width={90} 
                />
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <Bar 
                    dataKey="count" 
                    fill="var(--color-count)" 
                    radius={[0, 10, 10, 0]} 
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
            </BarChart>
        </ChartContainer>
    
    
  );
}