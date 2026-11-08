import React, { useState } from 'react'
// 1. Import hook useTheme từ dự án của bạn
import { useTheme } from '../../../components/theme/ThemeWrapper'

// Hàm helper để parse Markdown thô từ AI thành các thẻ HTML (Có bổ sung màu sắc theo theme)
const FormatMarkdown = ({ text, isNight }) => {
  if (!text) return null
  const lines = text.split('\n')
  return lines.map((line, index) => {
    let cleanLine = line.trim()
    if (cleanLine.startsWith('###') || cleanLine.startsWith('##')) {
      const headingText = cleanLine.replace(/^#+\s*/, '')
      return (
        <h4
          key={index}
          className={`font-black text-sm mt-4 mb-1.5 ${isNight ? 'text-blue-400' : 'text-blue-800'}`}
        >
          {headingText}
        </h4>
      )
    }
    if (cleanLine.startsWith('-') || cleanLine.startsWith('*')) {
      const bulletText = cleanLine.substring(1).trim()
      return (
        <li
          key={index}
          className={`list-disc ml-4 text-[12px] my-1 leading-relaxed ${isNight ? 'text-slate-300' : 'text-slate-600'}`}
        >
          {renderBoldText(bulletText, isNight)}
        </li>
      )
    }
    return (
      <p
        key={index}
        className={`text-[12px] my-1.5 leading-relaxed ${isNight ? 'text-slate-300' : 'text-slate-600'}`}
      >
        {renderBoldText(cleanLine, isNight)}
      </p>
    )
  })
}

const renderBoldText = (rawText, isNight) => {
  const parts = rawText.split(/\*\*([\s\S]*?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong
        key={i}
        className={`font-extrabold ${isNight ? 'text-white' : 'text-slate-900'}`}
      >
        {part}
      </strong>
    ) : (
      part
    ),
  )
}

const EvaluationWindow = ({
  data,
  loading,
  error,
  isOpen = true,
  onClose = () => {},
  historyList = [],
  totalHistory = 0,
  onFetchHistory = () => {},
  detailAssessment = null,
  onFetchDetail = () => {},
  onResetDetail = () => {},
  isDetailLoading = false,
  detailError = null,
}) => {
  // 2. Lấy trạng thái Night Mode từ Theme Context giống với RecentNotebooksCard
  const { isNight } = useTheme()

  const [activeTab, setActiveTab] = useState('today')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedDateLabel, setSelectedDateLabel] = useState('')
  const [customDate, setCustomDate] = useState('')
  const ITEMS_PER_PAGE = 10

  const totalPages = Math.ceil(totalHistory / ITEMS_PER_PAGE) || 1

  const executeSearch = (dateVal) => {
    if (!dateVal) return
    const [year, month, day] = dateVal.split('-')
    if (!year || !month || !day || year.length < 4) return

    setSelectedDateLabel(`${day}/${month}/${year}`)
    onFetchDetail(dateVal)
  }

  const handleCustomDateChange = (e) => {
    setCustomDate(e.target.value)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      executeSearch(customDate)
    }
  }

  // 3. Khởi tạo hệ thống Class đặc hoàn toàn (Opacity = 1) và không làm mờ nền
  const windowCls = isNight
    ? 'bg-slate-900 border-white/[0.1] shadow-2xl text-slate-200'
    : 'bg-white/60 border-gray-200 backdrop-blur-xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] text-slate-800'

  const headerCls = isNight
    ? 'bg-gradient-to-r from-blue-950 to-slate-900 border-b border-white/[0.08]'
    : 'bg-gradient-to-r from-blue-600 to-indigo-600/60'

  const itemBaseCls = isNight
    ? 'bg-slate-800 border-white/[0.06] hover:bg-slate-700 text-slate-200'
    : 'bg-white border-gray-200 hover:bg-gray-50 hover:shadow-sm text-slate-700/80'

  const subCardCls = isNight
    ? 'bg-slate-800 border-white/[0.06]'
    : 'bg-gray-50 border-gray-100 shadow-sm'

  return (
    <div
      className={`w-[360px] h-[500px] rounded-[2rem] border-2 flex flex-col overflow-hidden transition-all duration-500 ${windowCls} animate-fade-in`}
    >
      {/* Header */}
      <div
        className={`p-4 text-white font-black flex items-center justify-between flex-shrink-0 ${headerCls}`}
      >
        <div className="flex items-center gap-2 text-[14px]">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span>Cố vấn Học tập AI</span>
        </div>
        {isOpen && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-all hover:bg-white/20 hover:rotate-90"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z" />
            </svg>
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div
        className={`flex border-b text-xs font-extrabold flex-shrink-0 ${isNight ? 'border-white/[0.08] bg-slate-950' : 'border-gray-200 bg-gray-100'}`}
      >
        <button
          className={`flex-1 py-3 text-center transition-all ${activeTab === 'today' ? (isNight ? 'border-b-2 border-blue-400 text-blue-400 bg-slate-900' : 'border-b-2 border-blue-600 text-blue-600 bg-white') : isNight ? 'text-slate-500 hover:text-slate-300' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => {
            setActiveTab('today')
            onResetDetail()
          }}
        >
          Đánh giá gần nhất
        </button>
        <button
          className={`flex-1 py-3 text-center transition-all ${activeTab === 'history' ? (isNight ? 'border-b-2 border-blue-400 text-blue-400 bg-slate-900' : 'border-b-2 border-blue-600 text-blue-600 bg-white') : isNight ? 'text-slate-500 hover:text-slate-300' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => {
            setActiveTab('history')
            onResetDetail()
            setCustomDate('')
            setCurrentPage(1)
            onFetchHistory(ITEMS_PER_PAGE, 0)
          }}
        >
          Lịch sử ({totalHistory})
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 p-4 flex flex-col justify-between overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div
              className={`flex space-x-1.5 p-3 rounded-xl shadow-sm ${isNight ? 'bg-slate-800' : 'bg-white'}`}
            >
              <div
                className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <div
                className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <div
                className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* TAB 1: Hôm nay */}
            {activeTab === 'today' && (
              <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar flex flex-col">
                {data && data.trim() !== '' ? (
                  <div
                    className={`p-4 rounded-2xl border mb-auto transition-all ${subCardCls}`}
                  >
                    <FormatMarkdown text={data} isNight={isNight} />
                  </div>
                ) : (
                  <div className="text-center px-4 py-8 flex flex-col items-center justify-center space-y-3 mt-12 my-auto">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${isNight ? 'bg-slate-800' : 'bg-blue-50'}`}
                    >
                      ✨
                    </div>
                    <h4
                      className={`text-[14px] font-black ${isNight ? 'text-gray-300' : 'text-gray-600'}`}
                    >
                      Chưa có đánh giá nào!
                    </h4>
                    <p
                      className={`text-[12px] font-bold text-center max-w-[85%] leading-relaxed ${isNight ? 'text-gray-500' : 'text-gray-400'}`}
                    >
                      Bé hãy bắt đầu bài học để nhận đánh giá vào hôm sau nhé.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Lịch sử */}
            {activeTab === 'history' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Ô TRA CỨU THEO NGÀY */}
                {!detailAssessment && !detailError && !isDetailLoading && (
                  <div
                    className={`mb-3 p-3 rounded-2xl border flex flex-col gap-1.5 flex-shrink-0 ${subCardCls}`}
                  >
                    <label
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-0.5 ${isNight ? 'text-slate-400' : 'text-gray-400'}`}
                    >
                      🔍 Tra cứu nhanh theo ngày
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={customDate}
                        onChange={handleCustomDateChange}
                        onKeyDown={handleKeyDown}
                        /* ĐÃ SỬA: Thêm class [color-scheme:dark] khi isNight để ép nút lịch chuyển sang màu trắng */
                        className={`flex-1 p-2 border rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 transition-all ${
                          isNight
                            ? 'bg-slate-950 border-white/[0.08] text-white [color-scheme:dark]'
                            : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                      />
                      <button
                        onClick={() => executeSearch(customDate)}
                        disabled={!customDate}
                        className="px-3 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all"
                      >
                        Tìm
                      </button>
                    </div>
                  </div>
                )}

                {error ? (
                  <div className="text-center text-red-400 my-auto px-4 text-xs font-bold py-16">
                    ⚠️ Không thể tải danh sách lịch sử.
                  </div>
                ) : isDetailLoading || detailAssessment || detailError ? (
                  /* MÀN HÌNH CHI TIẾT */
                  <div className="flex-1 flex flex-col overflow-hidden justify-between animate-fade-in">
                    <div className="flex flex-col flex-shrink-0">
                      <button
                        onClick={() => {
                          onResetDetail()
                          setCustomDate('')
                        }}
                        className={`flex items-center gap-1 text-xs font-extrabold mb-2 hover:underline w-fit ${isNight ? 'text-blue-400' : 'text-blue-600'}`}
                      >
                        ← Quay lại danh sách chính
                      </button>
                      <div
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md mb-2 w-fit ${isNight ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/30' : 'bg-indigo-50 text-indigo-700'}`}
                      >
                        Ngày: {selectedDateLabel}
                      </div>
                    </div>

                    {isDetailLoading ? (
                      <div className="flex flex-col justify-center items-center flex-1 text-xs text-gray-400 gap-2 my-auto py-12">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        Đang tra cứu đánh giá...
                      </div>
                    ) : detailError ? (
                      <div
                        className={`p-5 rounded-2xl text-red-400 text-xs text-center font-bold my-auto border ${subCardCls}`}
                      >
                        ⚠️ Không tìm thấy đánh giá chi tiết cho ngày này.
                      </div>
                    ) : (
                      <div
                        className={`p-4 rounded-2xl border overflow-y-auto custom-scrollbar flex-1 ${subCardCls}`}
                      >
                        <FormatMarkdown
                          text={detailAssessment}
                          isNight={isNight}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  /* MÀN HÌNH DANH SÁCH CHÍNH */
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <p
                      className={`text-[10px] font-extrabold px-0.5 mb-1.5 flex-shrink-0 ${isNight ? 'text-slate-400' : 'text-gray-400'}`}
                    >
                      Chọn từ danh sách dưới đây:
                    </p>

                    <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[225px] pr-1 custom-scrollbar">
                      {historyList.length > 0 ? (
                        historyList.map((item, idx) => {
                          const assessmentOfQuery = item.assessment_of || ''
                          let dateDisplay = 'Không rõ ngày'
                          if (assessmentOfQuery) {
                            const [year, month, day] =
                              assessmentOfQuery.split('-')
                            if (year && month && day)
                              dateDisplay = `${day}/${month}/${year}`
                          }

                          return (
                            <div
                              key={item.id || idx}
                              onClick={() => {
                                setSelectedDateLabel(dateDisplay)
                                onFetchDetail(assessmentOfQuery)
                              }}
                              className={`px-3 py-2.5 border-2 rounded-2xl cursor-pointer transition-all flex justify-between items-center flex-shrink-0 ${itemBaseCls}`}
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <span className="font-extrabold text-[12px] flex-shrink-0">
                                  📑 Nhật ký #
                                  {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                                </span>
                                <span
                                  className={`text-[11px] font-semibold truncate ${isNight ? 'text-slate-400' : 'text-gray-400'}`}
                                >
                                  — {dateDisplay}
                                </span>
                              </div>
                              <span
                                className={`text-[11px] font-extrabold flex-shrink-0 ${isNight ? 'text-blue-400' : 'text-blue-500'}`}
                              >
                                Xem →
                              </span>
                            </div>
                          )
                        })
                      ) : (
                        <div className="text-center text-gray-400 py-12 text-xs my-auto">
                          Chưa có lịch sử đánh giá nào.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PHÂN TRANG */}
        {activeTab === 'history' &&
          !detailAssessment &&
          !detailError &&
          !isDetailLoading &&
          !loading &&
          !error &&
          totalPages > 1 && (
            <div
              className={`flex justify-between items-center border-t pt-3 text-xs flex-shrink-0 ${isNight ? 'border-white/[0.08]' : 'border-gray-200'}`}
            >
              <button
                disabled={currentPage === 1}
                onClick={() => {
                  const nextPage = Math.max(currentPage - 1, 1)
                  setCurrentPage(nextPage)
                  onFetchHistory(
                    ITEMS_PER_PAGE,
                    (nextPage - 1) * ITEMS_PER_PAGE,
                  )
                }}
                className={`px-2.5 py-1.5 rounded-xl border font-extrabold disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${isNight ? 'bg-slate-800 border-white/[0.06] text-slate-300 hover:bg-slate-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                Trước
              </button>
              <span
                className={`font-bold text-[11px] ${isNight ? 'text-slate-400' : 'text-gray-500'}`}
              >
                Trang {currentPage} / {totalPages}
              </span>
              <button
                disabled={
                  currentPage === totalPages ||
                  historyList.length < ITEMS_PER_PAGE
                }
                onClick={() => {
                  const nextPage = Math.min(currentPage + 1, totalPages)
                  setCurrentPage(nextPage)
                  onFetchHistory(
                    ITEMS_PER_PAGE,
                    (nextPage - 1) * ITEMS_PER_PAGE,
                  )
                }}
                className={`px-2.5 py-1.5 rounded-xl border font-extrabold disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${isNight ? 'bg-slate-800 border-white/[0.06] text-slate-300 hover:bg-slate-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                Sau
              </button>
            </div>
          )}
      </div>
    </div>
  )
}

export default EvaluationWindow
