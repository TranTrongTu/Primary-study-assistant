// src/features/documents/components/AddSourceModal.jsx
import React, { useRef, useState, useEffect } from "react";
import { useTheme } from "../../../components/theme/ThemeWrapper"; 

// 🎯 1. Đồng bộ 4 môn học (Thêm Khác)
const SUBJECTS = [
  { id: 'MATHS', label: 'Toán', emoji: '📐' },
  { id: 'VIETNAMESE', label: 'Tiếng Việt', emoji: '📖' },
  { id: 'ENGLISH', label: 'Tiếng Anh', emoji: '🔤' },
  { id: null, label: 'Khác', emoji: '📂' } 
];

export const AddSourceModal = ({ isOpen, onClose, onAdd }) => {
  const { isNight } = useTheme(); 
  
  const [fileItems, setFileItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isFlipping, setIsFlipping] = useState(false);

  const fileInputRef = useRef(null);

  const changeFile = (newIndex) => {
    if (newIndex === currentIndex || isFlipping) return; 
    setIsFlipping(true); 
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setTimeout(() => setIsFlipping(false), 50);
    }, 150); 
  };

  useEffect(() => {
    if (fileItems.length > 0 && fileItems[currentIndex]?.file) {
      const file = fileItems[currentIndex].file;
      const isPreviewable = file.type.startsWith("image/") || 
                            file.type.startsWith("video/") || 
                            file.type.startsWith("audio/") || 
                            file.type === "application/pdf";
      
      if (isPreviewable) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
      }
    }
    setPreviewUrl(null);
  }, [fileItems, currentIndex]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      // 🎯 2. Đổi 'MATHS' thành '' (Rỗng) để giao diện không chọn mặc định
      const newItems = selectedFiles.map(f => ({ file: f, subject_type: undefined }));
      setFileItems((prev) => [...prev, ...newItems]);
      if (fileItems.length === 0) setCurrentIndex(0); 
    }
  };

  const handleRemoveFile = (e, indexToRemove) => {
    e.stopPropagation();
    const newItems = fileItems.filter((_, idx) => idx !== indexToRemove);
    setFileItems(newItems);
    
    if (indexToRemove === currentIndex) {
      const nextIndex = Math.max(0, indexToRemove - 1);
      if (newItems.length > 0) changeFile(Math.min(nextIndex, newItems.length - 1));
      else setCurrentIndex(0);
    } else if (indexToRemove < currentIndex) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const updateSubjectForCurrentFile = (subjectId) => {
    setFileItems(prev => prev.map((item, idx) => {
      if (idx === currentIndex) {
        // 🎯 3. Bấm lại môn đang chọn sẽ HỦY CHỌN (về rỗng)
        return { ...item, subject_type: item.subject_type === subjectId ? undefined : subjectId };
      }
      return item;
    }));
  };

  const handleAdd = () => {
    // Không cần delete hay xóa field nào nữa, ném nguyên cụm item qua cho useDocuments xử lý
    onAdd(fileItems); 
    setFileItems([]);
    setCurrentIndex(0);
    onClose(); 
  };

  const renderFilePreview = (file, url) => {
    if (!file) return null;
    if (file.type.startsWith("image/")) return <img src={url} alt="preview" className="w-full h-full object-contain drop-shadow-md rounded-2xl" />;
    if (file.type.startsWith("video/")) return <video controls src={url} className="w-full h-full object-contain bg-black rounded-2xl" />;
    if (file.type.startsWith("audio/")) return <div className="w-full h-full flex flex-col justify-center items-center gap-4"><span className="text-6xl animate-bounce">🎵</span><audio controls src={url} className="w-full max-w-sm" /></div>;
    if (file.type === "application/pdf") return <iframe src={url} className={`w-full h-full border-none rounded-2xl ${isNight ? 'bg-gray-300' : 'bg-white'}`} title="pdf" />;
    
    return (
      <div className={`w-full h-full flex flex-col justify-center items-center text-center p-6 rounded-3xl border shadow-lg ${isNight ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-100'}`}>
        <div className="text-6xl mb-4">📄</div>
        <p className={`font-bold text-lg ${isNight ? 'text-gray-300' : 'text-slate-500'}`}>Tệp {file.type.split('/')[1]?.toUpperCase() || "KHÔNG RÕ"}</p>
        <p className={`text-sm mt-1 ${isNight ? 'text-gray-500' : 'text-slate-400'}`}>Hệ thống không hỗ trợ xem trước tệp này</p>
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md p-4 ${isNight ? 'bg-black/70' : 'bg-slate-900/55'}`} onClick={onClose}>
      <div 
        className={`relative w-full max-w-[1100px] rounded-[3rem] p-8 md:p-10 shadow-2xl border animate-in fade-in zoom-in-95 duration-300 ${
          isNight ? 'bg-gray-900 border-gray-700' : 'bg-white border-white/20'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className={`absolute right-8 top-8 p-2 rounded-full transition-colors z-10 ${
          isNight ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-slate-100 text-slate-400'
        }`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        <header className="mb-6">
          <h2 className={`text-3xl font-black ${isNight ? 'text-gray-100' : 'text-slate-800'}`}>
            <span className="text-[#4ecdc4] mr-2">+</span>Thêm nguồn học tập
          </h2>
          <p className={`text-sm mt-1 font-medium ${isNight ? 'text-gray-400' : 'text-slate-500'}`}>
            Bé hãy chọn những tài liệu hay để tớ học cùng nhé!
          </p>
        </header>

        <input type="file" ref={fileInputRef} accept=".pdf,image/*,audio/*,video/*" onChange={handleFileChange} hidden multiple />

        <div className="flex flex-col justify-center relative">
          {fileItems.length === 0 ? (
            <div 
              onClick={() => fileInputRef.current.click()}
              className={`group flex flex-col items-center justify-center rounded-[3rem] h-[450px] border-4 border-dashed cursor-pointer transition-all duration-300 ${
                isNight 
                  ? 'border-gray-700 bg-gray-800/50 hover:bg-[#132c2a] hover:border-[#4ecdc4]' 
                  : 'border-slate-200 bg-slate-50/50 hover:bg-[#f2fcfb] hover:border-[#4ecdc4]'
              }`}
            >
              <div className="text-7xl mb-6 group-hover:scale-110 transition-transform">☁️</div>
              <p className={`text-2xl font-black group-hover:text-[#4ecdc4] ${isNight ? 'text-gray-500' : 'text-slate-400'}`}>Bấm để chọn hoặc thả tệp vào đây</p>
              <p className={`mt-3 text-xs font-bold uppercase tracking-widest ${isNight ? 'text-gray-600' : 'text-slate-400'}`}>Hỗ trợ PDF, Hình ảnh, Âm thanh, Video</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-8 animate-in slide-in-from-bottom-8 duration-500 h-[600px]">
              
              <div className="flex flex-col h-full relative">
                <div className="flex justify-between items-center mb-3 px-2 shrink-0">
                  <h3 className={`font-bold text-sm ${isNight ? 'text-gray-300' : 'text-slate-700'}`}>Xem trước tài liệu</h3>
                  <span className={`text-xs font-black px-3 py-1 rounded-full ${isNight ? 'bg-gray-800 text-gray-400' : 'bg-slate-100 text-slate-500'}`}>
                    {currentIndex + 1} / {fileItems.length}
                  </span>
                </div>
                
                <div 
                  className={`flex-1 rounded-[2.5rem] border-2 shadow-inner flex items-center justify-center overflow-hidden relative group ${
                    isNight ? 'bg-gray-800/50 border-gray-700' : 'bg-slate-100/50 border-slate-100'
                  }`}
                  style={{ perspective: "1500px" }} 
                >
                  {previewUrl ? (
                    <div 
                      className={`absolute inset-0 p-3 transition-all duration-300 ease-in-out ${
                        isFlipping 
                        ? 'opacity-0 scale-90 [transform:rotateY(-90deg)]' 
                        : 'opacity-100 scale-100 [transform:rotateY(0deg)]' 
                      }`}
                    >
                      {renderFilePreview(fileItems[currentIndex].file, previewUrl)}
                    </div>
                  ) : (
                    <div className="text-center p-10 opacity-30">
                      <div className="text-5xl mb-2 animate-bounce">⏳</div>
                      <p className="text-xs font-bold uppercase tracking-widest">Đang tải bản xem trước...</p>
                    </div>
                  )}

                  {fileItems.length > 1 && (
                    <div className={`absolute inset-y-0 left-4 right-4 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isFlipping ? 'hidden' : ''}`}>
                      <button 
                        onClick={() => changeFile(currentIndex === 0 ? fileItems.length - 1 : currentIndex - 1)}
                        className={`pointer-events-auto flex items-center justify-center w-12 h-12 rounded-full shadow-xl hover:bg-[#4ecdc4] hover:text-white hover:scale-110 transition-all ${
                          isNight ? 'bg-gray-700 text-gray-200' : 'bg-white/90 backdrop-blur text-slate-700'
                        }`}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15 18l-6-6 6-6"/></svg>
                      </button>
                      <button 
                        onClick={() => changeFile((currentIndex + 1) % fileItems.length)}
                        className={`pointer-events-auto flex items-center justify-center w-12 h-12 rounded-full shadow-xl hover:bg-[#4ecdc4] hover:text-white hover:scale-110 transition-all ${
                          isNight ? 'bg-gray-700 text-gray-200' : 'bg-white/90 backdrop-blur text-slate-700'
                        }`}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col h-full overflow-hidden relative">
                <h3 className={`font-bold text-sm mb-3 shrink-0 ${isNight ? 'text-gray-300' : 'text-slate-700'}`}>Tệp đã chọn ({fileItems.length})</h3>
                
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 pb-2">
                  {fileItems.map((item, i) => {
                    const subjectInfo = SUBJECTS.find(s => s.id === item.subject_type);
                    return (
                      <div 
                        key={i} 
                        onClick={() => changeFile(i)} 
                        className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-200 group ${
                          i === currentIndex 
                            ? (isNight ? 'bg-[#132c2a] border-[#4ecdc4] shadow-[0_4px_12px_rgba(78,205,196,0.15)] scale-[1.02]' : 'bg-[#f0fbfb] border-[#4ecdc4] shadow-[0_4px_12px_rgba(78,205,196,0.15)] scale-[1.02]')
                            : (isNight ? 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-750' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50')
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="text-2xl drop-shadow-sm">📄</span>
                          <div className="min-w-0 flex flex-col items-start gap-1">
                            <p className={`font-bold truncate text-[13px] transition-colors w-full ${
                              i === currentIndex 
                                ? 'text-[#38a89f]' 
                                : (isNight ? 'text-gray-200' : 'text-slate-700')
                            }`}>{item.file.name}</p>
                            
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-semibold uppercase ${isNight ? 'text-gray-500' : 'text-slate-400'}`}>
                                {(item.file.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                              {/* 🎯 5. Nhãn hiển thị Tự động nếu không có môn nào */}
                              <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wide ${isNight ? 'bg-gray-700 text-gray-300' : 'bg-slate-100 text-slate-500'}`}>
                                {subjectInfo ? subjectInfo.label : 'TỰ ĐỘNG (AI)'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => handleRemoveFile(e, i)} 
                          className={`p-2 rounded-xl transition-colors shrink-0 ${
                            isNight ? 'text-gray-500 hover:text-red-400 hover:bg-red-900/30' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'
                          }`}
                          title="Xóa tệp này"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                      </div>
                    )
                  })}
                  
                  <button 
                    onClick={() => fileInputRef.current.click()} 
                    className={`w-full py-4 border-2 border-dashed rounded-2xl font-bold text-sm transition-all ${
                      isNight ? 'border-gray-700 text-gray-500 hover:bg-gray-800 hover:border-gray-600 hover:text-gray-300' : 'border-slate-200 text-slate-400 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-600'
                    }`}
                  >
                    + Thêm tệp khác
                  </button>
                </div>
                
                {isFlipping && <div className={`absolute inset-0 z-10 ${isNight ? 'bg-gray-900/20' : 'bg-white/20'}`}></div>}

                <div className={`mt-2 mb-4 p-4 rounded-2xl border transition-all ${isNight ? 'bg-gray-800/50 border-gray-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className={`text-[11px] font-extrabold uppercase tracking-wide ${isNight ? 'text-gray-400' : 'text-slate-500'}`}>
                      📚 Môn học cho file này
                    </h4>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {SUBJECTS.map(sub => {
                      const isSelected = fileItems[currentIndex]?.subject_type === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => updateSubjectForCurrentFile(sub.id)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl text-[11px] font-bold transition-all ${
                            isSelected
                              ? "bg-[#4ecdc4] text-white shadow-md shadow-[#4ecdc4]/30 border border-[#4ecdc4]"
                              : (isNight ? "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200")
                          }`}
                        >
                          <span className="text-sm">{sub.emoji}</span> {sub.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className={`pt-4 border-t flex flex-col xl:flex-row justify-end gap-3 shrink-0 ${isNight ? 'border-gray-700' : 'border-slate-100'}`}>
                  <button onClick={() => setFileItems([])} className={`rounded-full px-6 py-4 text-sm font-bold transition-colors ${
                    isNight ? 'text-gray-400 hover:bg-gray-800' : 'text-slate-500 hover:bg-slate-100'
                  }`}>
                    Xóa tất cả
                  </button>
                  <button 
                    onClick={handleAdd}
                    className="flex-1 rounded-full px-6 py-4 text-[15px] font-black bg-[#4ecdc4] text-white shadow-[0_8px_20px_rgba(78,205,196,0.3)] hover:scale-105 active:scale-95 hover:bg-[#38b5ac] transition-all duration-300 flex items-center justify-center gap-3"
                  >
                    Tải lên ngay ({fileItems.length})
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};