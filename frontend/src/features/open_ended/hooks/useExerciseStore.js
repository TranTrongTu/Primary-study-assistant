// src/features/open_ended/hooks/useExerciseStore.js
import { create } from 'zustand';

export const useExerciseStore = create((set, get) => ({
    // 1. Nơi chứa dữ liệu
    allUnsureItems: {}, 

    // 2. Hàm lấy dữ liệu ra
    getUnsureItems: (activityId) => {
        return get().allUnsureItems[`activity_${activityId}`] || new Set();
    },

    // 3. Hàm thay đổi dữ liệu
    toggleUnsure: (activityId, itemId) => set((state) => {
        const key = `activity_${activityId}`;
        const currentSet = state.allUnsureItems[key] || new Set();
        const newSet = new Set(currentSet);
        
        newSet.has(itemId) ? newSet.delete(itemId) : newSet.add(itemId);
        
        return { 
            allUnsureItems: { ...state.allUnsureItems, [key]: newSet } 
        };
    })
}));