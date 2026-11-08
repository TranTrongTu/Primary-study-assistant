import React, { useState } from "react";
import useQuizManagement from "./hooks/useQuizManagement.js";
import QuizPanel from "./components/QuizPanel.jsx";

/**
 * Demo/Test page để thử quiz feature
 */
const QuizTestPage = () => {
  const interactionId = 1; // Hardcode cho test, sau sẽ lấy từ URL
  const { quizzes, isLoading, error, createNewQuiz, removeQuiz } =
    useQuizManagement(interactionId);

  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">
          🧪 Quiz Feature Test
        </h1>

        {isOpen && (
          <QuizPanel
            quizzes={quizzes}
            isLoading={isLoading}
            onCreateQuiz={async (quizParams) => {
              const result = await createNewQuiz(quizParams);
              return result;
            }}
            error={error}
            onClose={() => setIsOpen(false)}
          />
        )}

        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Mở Quiz Panel
          </button>
        )}

        {/* Debug info */}
        <div className="mt-8 p-4 bg-gray-800 text-gray-100 rounded-lg font-mono text-sm">
          <p>Quiz count: {quizzes.length}</p>
          <p>Loading: {isLoading ? "true" : "false"}</p>
          <p>Error: {error || "none"}</p>
        </div>
      </div>
    </div>
  );
};

export default QuizTestPage;
