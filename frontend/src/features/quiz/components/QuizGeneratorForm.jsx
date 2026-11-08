import React, { useState } from "react";
import { MagicWand, Trash } from "@phosphor-icons/react";
import { useTheme } from "../../../components/theme/ThemeWrapper";

const SUBJECTS = [
  { id: "VIETNAMESE", label: "Tiếng Việt" },
  { id: "MATHS", label: "Toán" },
  { id: "ENGLISH", label: "Tiếng Anh" },
];

const QuizGeneratorForm = ({
  isLoading = false,
  error = null,
  prompt = "",
  setPrompt = () => {},
  onCreateQuiz = () => {},
}) => {
  const { isNight } = useTheme();
  const [subject, setSubject] = useState(SUBJECTS[0].id);

  const handleSubmit = () => {
    if (!prompt || prompt.trim().length === 0) return;
    onCreateQuiz({ subjectType: subject, prompt: prompt.trim() });
  };

  return (
    <div
      className={`w-full p-4 rounded-2xl border ${isNight ? "bg-gray-800/70 border-gray-700 text-gray-100" : "bg-white/90 border-gray-200 text-gray-800"}`}
    >
      <h3 className="text-lg font-black mb-3">Tạo Quiz</h3>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Nhập đề bài hoặc dán nội dung để tạo câu hỏi..."
        className={`w-full h-32 p-3 rounded-xl resize-none outline-none border-2 ${isNight ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100"}`}
      />

      <div className="mt-3 flex gap-2">
        {SUBJECTS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSubject(s.id)}
            className={`px-3 py-2 rounded-xl font-bold text-xs border-2 ${subject === s.id ? "bg-purple-500 text-white border-purple-400" : isNight ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-white border-gray-100 text-gray-600"}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-3 text-red-500 font-semibold">{String(error)}</div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setPrompt("")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-red-500 border-2 border-red-200 hover:bg-red-50"
        >
          <Trash size={16} /> Xóa
        </button>

        <button
          onClick={handleSubmit}
          disabled={isLoading || !prompt || prompt.trim().length === 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-white ${isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600"}`}
        >
          <MagicWand size={18} /> {isLoading ? "Đang tạo..." : "Tạo Quiz"}
        </button>
      </div>
    </div>
  );
};

export default QuizGeneratorForm;
