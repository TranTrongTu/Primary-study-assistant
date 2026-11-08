export const getDropdownClasses = (isNight) => {
    // Nút Trigger (Button)
    const btnCls = isNight 
        ? "bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white focus:bg-slate-700 focus:text-white data-[state=open]:bg-slate-700 data-[state=open]:text-white" 
        : "bg-white text-slate-800 border-gray-200 hover:bg-gray-100 focus:bg-gray-100 data-[state=open]:bg-gray-100";
        
    // Khung menu thả xuống (Content)
    const contentCls = isNight
        ? "bg-slate-800 border-slate-700 text-slate-200"
        : "bg-white border-gray-200 text-slate-800";
        
    // Các dòng lựa chọn (Item)
    const itemCls = isNight
        ? "hover:bg-slate-700 focus:bg-slate-700 focus:text-white cursor-pointer"
        : "hover:bg-gray-100 focus:bg-gray-100 cursor-pointer";

    return {
        btnCls,
        contentCls,
        itemCls
    }
}

export const getSidebarCardClasses = (isNight) => {
    return isNight 
        ? "bg-slate-900 border-slate-800 text-slate-200" 
        : "bg-white border-slate-200 text-slate-800";
};