import { create } from 'zustand';

export const useChartStore = create((set) => ({
  refreshKey: 0,
  // Hàm này mỗi lần gọi sẽ tăng số đếm lên 1 để tạo sự thay đổi state
  triggerRefresh: () => set((state) => ({ refreshKey: state.refreshKey + 1 })),
}));