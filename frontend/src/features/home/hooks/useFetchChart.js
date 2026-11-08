import { useState, useEffect } from 'react';
import { useChartStore } from './useChartStore';

/**
 * Hook dùng chung để gọi API biểu đồ
 * @param {Function} apiFunction - Hàm gọi API (VD: fetchScoreRatioRadarChart)
 * @param {Array} payload - Mảng điều kiện lọc
 * @param {Function} transformFunction - Hàm biến đổi dữ liệu (VD: transformScoreData)
 */
export const useFetchChart = (apiFunction, payload, transformFunction) => {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const refreshKey = useChartStore((state) => state.refreshKey);

    useEffect(() => {
        // Dùng biến cờ để tránh lỗi memory leak nếu component unmount trước khi API trả về
        let isMounted = true; 

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                // // ========================================================
                // // TODO: XÓA ĐOẠN CODE TEST NÀY SAU KHI TEST GIAO DIỆN XONG
                // // ========================================================
                // const isTesting = true; 
                // if (isTesting) {
                //     throw {
                //         response: {
                //             // Đổi số 500 thành 400 để xem các giao diện khác nhau
                //             status: 500, 
                //             data: {
                //                 exception_type: "INTERNAL_ERROR",
                //                 message: "Đội kỹ thuật đang xử lý sự cố. Test UI lỗi 500!"
                //             }
                //         }
                //     };
                // }

                const rawData = await apiFunction(payload);
                
                if (isMounted) {
                    // Nếu có hàm transform thì chạy, không thì giữ nguyên rawData
                    const finalData = transformFunction ? transformFunction(rawData) : rawData;
                    setData(finalData);
                }
            } catch (err) {
                if (isMounted) {
                    const status = err.response?.status
                    const backendMessage = err.response?.data?.message

                    let errorState = {
                        type: "ERROR",
                        message: ""
                    }

                    if (status === 400 || status === 500) {
                        errorState.type = 'MAINTENANCE';
                        errorState.message = "Oops, biểu đồ này đang bị kẹt một chút. Đội ngũ kỹ thuật đang sửa, bạn xem tạm các thông tin khác nhé!";
                        console.error(`[Chart Error ${status}]:`, backendMessage);
                    }
                    else {
                        errorState.type = 'ERROR';
                        errorState.message = "Có lỗi nhỏ xảy ra khi tải dữ liệu rồi!";
                    }

                    setError(errorState);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchData();

        // Cleanup function
        return () => {
            isMounted = false;
        };
        
    // Chạy lại Effect này mỗi khi payload thực sự thay đổi
    }, [JSON.stringify(payload), refreshKey]); 

    return { data, isLoading, error };
};