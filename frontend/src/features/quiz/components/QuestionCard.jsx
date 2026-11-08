import React from "react";
import { useTheme } from "../../../components/theme/ThemeWrapper";
import { SmartContent } from "../../../components/SmartContent";

const QuestionCard = ({
  question,
  selectedOption,
  onSelectOption,
  isSubmitted,
  compact = false, // false | true | 'tight'
}) => {
  const { isNight } = useTheme();
  if (!question) return null;

  const hasExplanation =
    typeof question.explanation === "string" &&
    question.explanation.trim().length > 0;

  const isTight = compact === "tight";
  const isCompact = compact === true || isTight;

  const outerPadding = isTight ? "p-2" : isCompact ? "p-3" : "p-5.5";
  const questionTextSize = isTight
    ? "text-base"
    : isCompact
      ? "text-lg"
      : "text-xl";
  const optionPadding = isTight ? "p-2" : isCompact ? "p-3" : "p-4";
  const optionGap = isTight ? "gap-1" : isCompact ? "gap-1" : "gap-2";
  const explanationPadding = isTight
    ? "mt-4 p-4"
    : isCompact
      ? "mt-4 p-4"
      : "mt-4 p-4";

  return (
    <>
      {/* Định nghĩa Animation nội bộ để giao diện mượt mà không cần sửa config */}
      <style>
        {`
          @keyframes slideFadeIn {
            0% { opacity: 0; transform: translateX(20px); }
            100% { opacity: 1; transform: translateX(0); }
          }
          .animate-slide-fade {
            animation: slideFadeIn 0.35s ease-out forwards;
          }
        `}
      </style>

      {/* ĐIỂM QUYẾT ĐỊNH: Thuộc tính key={question.id} giúp React render lại animation mỗi khi đổi câu hỏi */}
      <div
        key={question.id}
        className={`animate-slide-fade rounded-2xl border ${outerPadding} ${isTight ? "min-h-[260px]" : isCompact ? "min-h-[220px]" : ""} shadow-[0_12px_24px_rgba(15,23,42,0.08)] ${
          isNight
            ? "border-[#7d95e2]/40 bg-[#111a38]/90"
            : "border-[#7adfd9]/45 bg-gradient-to-br from-white via-[#fff3e6] to-[#e0f2fe] ring-1 ring-[#9be7e2]/40"
        }`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          {/* ĐÃ SỬA: Đổi thẻ <p> thành <div> và bọc SmartContent cho CÂU HỎI */}
          <div
            className={`${questionTextSize} font-semibold ${isNight ? "text-slate-100" : "text-gray-800"}`}
          >
            <SmartContent>{question.text}</SmartContent>
          </div>

          {/* Hiển thị điểm của câu hỏi nếu đã nộp bài */}
          {isSubmitted && question.userScore !== undefined && (
            <span
              className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-sm font-bold ${
                question.userScore > 0
                  ? "border-green-300 bg-green-100 text-green-700"
                  : "border-red-300 bg-red-100 text-red-700"
              }`}
            >
              {question.userScore} / {question.maxScore} pts
            </span>
          )}
        </div>

        <div className={`mt-4 grid ${optionGap}`}>
          {question.options.map((option) => {
            const isSelected = selectedOption === option.id;
            const showCorrect = isSubmitted && option.isCorrect;
            const showWrong =
              isSubmitted && isSelected && option.isCorrect === false;

            const defaultClass = isNight
              ? "border-[#7d95e2]/40 bg-[#1a254f]/70 text-slate-100 hover:bg-[#1a254f]"
              : "border-[#9adfd8]/50 bg-white/90 text-gray-700 hover:border-[#4ecdc4]/60 hover:bg-[#eafffb]";

            const selectedClass = isNight
              ? "border-[#4ecdc4] bg-[#183a63] text-slate-100"
              : "border-[#4ecdc4] bg-gradient-to-r from-[#d7fff8] to-[#b8f5ea] text-[#0f3f4f] shadow-[0_10px_20px_rgba(78,205,196,0.25)]";

            let stateClass = isSelected ? selectedClass : defaultClass;

            // Backend trả về isCorrect nên UI tô màu tương ứng
            if (showCorrect) {
              stateClass = isNight
                ? "border-emerald-400 bg-emerald-500/25 text-emerald-50 shadow-[0_12px_22px_rgba(16,185,129,0.35)]"
                : "border-green-500 bg-green-100 text-green-900";
            } else if (showWrong) {
              stateClass = isNight
                ? "border-rose-400 bg-rose-500/25 text-rose-50 shadow-[0_12px_22px_rgba(244,63,94,0.35)]"
                : "border-red-500 bg-red-100 text-red-900";
            }

            return (
              <button
                key={option.id}
                onClick={() => !isSubmitted && onSelectOption(option.id)}
                disabled={isSubmitted}
                className={`flex w-full items-center justify-between rounded-lg border-2 ${optionPadding} text-left font-medium transition-all duration-200 ${stateClass} ${
                  isSubmitted
                    ? "cursor-default"
                    : "cursor-pointer hover:shadow-md"
                }`}
              >
                {/* ĐÃ SỬA: Dùng SmartContent với inline={true} cho ĐÁP ÁN */}
                <SmartContent inline={true}>{option.content}</SmartContent>
              </button>
            );
          })}
        </div>

        {isSubmitted && hasExplanation && (
          <div
            className={`rounded-2xl border ${explanationPadding} ${
              isNight
                ? "border-cyan-400/30 bg-cyan-500/10 text-slate-100"
                : "border-cyan-200 bg-cyan-50 text-slate-800"
            }`}
          >
            <p
              className={`mb-1.5 ${isTight ? "text-sm" : "text-sm"} font-extrabold uppercase tracking-widest ${isNight ? "text-cyan-200" : "text-cyan-700"}`}
            >
              Giải thích
            </p>
            <div
              className={`${isTight ? "text-sm" : isCompact ? "text-sm" : "text-base"} leading-relaxed`}
            >
              <SmartContent>{question.explanation}</SmartContent>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default QuestionCard;
