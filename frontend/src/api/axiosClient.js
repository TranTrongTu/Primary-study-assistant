import axios from 'axios'

// 1. Khởi tạo một "Trạm kiểm soát" riêng cho dự án
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Khai báo URL gốc ở đây 1 lần duy nhất
  headers: {
    'Content-Type': 'application/json',
  },
})

// 2. KIỂM SOÁT ĐẦU RA (Request Interceptor)
// Nhiệm vụ: Trước khi bất kỳ API nào gọi lên server, tự động nhét Token vào thư gửi đi.
// Nhờ vậy bạn không cần phải copy/paste token vào từng hàm API nữa.
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      // Đính kèm vé vào Header theo chuẩn Bearer Token
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 3. KIỂM SOÁT ĐẦU VÀO (Response Interceptor)
// Nhiệm vụ: Lắng nghe và "tóm" lỗi 401 khi server trả về.
axiosClient.interceptors.response.use(
  (response) => {
    // Mọi thứ êm đẹp (Mã 200) -> Cho qua
    return response
  },
  (error) => {
    // TÓM LỖI 401 TẠI ĐÂY
    if (error.response && error.response.status === 401) {
      console.error('Còi báo động: Token hết hạn hoặc không hợp lệ!')

      // 1. Xóa cái vé cũ rách nát đi
      localStorage.removeItem('token')

      // 2. Đá người dùng văng ra màn hình Đăng nhập
      // Vì bạn dùng HashRouter nên URL bắt đầu bằng dấu #
      window.location.href = '#/login'

      //Trả về một Promise lửng lơ để "nuốt" luôn cái lỗi,
      // không cho nó chạy lọt xuống khối catch của useFetchChart nữa.
      return new Promise(() => {})
    }

    // Với các mã lỗi khác (400, 404, 500...), vẫn ném tiếp xuống cho Component tự xử lý
    return Promise.reject(error)
  },
)

export default axiosClient
