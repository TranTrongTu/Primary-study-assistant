import { useState, useEffect, useRef } from "react"

export const useHeatmapSize = () => {
    const [containerWidth, setContainerWidth] = useState(0);
    const containerRef = useRef(null);

    useEffect(() => {
        const observer = new ResizeObserver(entries => {
            if (entries[0]) {
                setContainerWidth(entries[0].contentRect.width);
            }
        })
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }
        if (containerRef.current) {
            setContainerWidth(containerRef.current.getBoundingClientRect().width);
        }

        return () => observer.disconnect();
        
    }, []);

    return { containerRef, containerWidth };

}