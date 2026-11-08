# Quiz Feature

## Cấu trúc

```
src/features/quiz/
├── api/              # API calls transformer
│   ├── quizAPI.js    # Transform backend data & API endpoints
│   └── index.ts      # Export
├── services/         # Business logic layer
│   ├── quiz.service.ts   # Service using generated API client
│   └── index.ts
├── hooks/            # React hooks
│   ├── useQuiz.ts           # React Query mutations wrapper
│   ├── useQuizGame.ts       # Game state management
│   ├── useQuizManagement.js # Quiz list management
│   └── index.ts
├── components/       # React components
│   ├── QuizPanel.jsx         # Main panel container
│   ├── QuizView.jsx          # Quiz display view
│   ├── QuestionCard.jsx      # Single question card
│   ├── QuizGeneratorForm.jsx # Form to create quiz
│   └── index.ts
├── types/            # TypeScript types
│   ├── quiz.ts       # Quiz types & interfaces
│   └── index.ts
├── utils/            # Utility functions
│   └── quizHelpers.ts
├── QuizTestPage.jsx  # Test/demo page
└── README.md         # This file
```

## Các Hook chính

### `useQuizManagement(interactionId)`

Quản lý danh sách quiz: load, tạo, xóa

```tsx
const {
  quizzes, // Danh sách quiz
  isLoading, // Đang tải không?
  error, // Lỗi nếu có
  createNewQuiz, // Tạo quiz mới
  removeQuiz, // Xóa quiz
  loadQuizzes, // Tải lại
} = useQuizManagement(interactionId);
```

### `useQuizGame(questions)`

Quản lý game state: câu hiện tại, câu trả lời, điểm

```tsx
const {
  currentQuestion, // Câu hỏi hiện tại
  currentIndex, // Index câu hỏi
  answers, // Array câu trả lời người dùng
  selectedOption, // Option được chọn
  totalQuestions, // Tổng số câu
  progress, // % hoàn thành
  handleSelectOption, // Chọn option
  nextQuestion, // Chuyển câu kế tiếp
  prevQuestion, // Quay lại câu trước
  jumpToQuestion, // Nhảy tới câu cụ thể
} = useQuizGame(questions);
```

### `useCreateQuiz()`

React Query mutation để tạo quiz

```tsx
const { mutate, isPending, error, data } = useCreateQuiz()
mutate({ interactionId: 1, data: {...} })
```

### `useSubmitAnswer()`, `useSubmitQuiz()`

Mutations để submit câu trả lời và nộp bài

## Các Component chính

### `<QuizPanel />`

Container chính hiển thị quiz

- Props: `quizzes`, `isLoading`, `onCreateQuiz`, `error`, `onClose`

### `<QuizView />`

Hiển thị quiz học

- Props: `data`, `isLoading`, `error`

### `<QuestionCard />`

Một câu hỏi với options

- Props: `question`, `onSelectOption`, `selectedOption`, `isSubmitted`

### `<QuizGeneratorForm />`

Form tạo quiz mới

- Props: `isLoading`, `error`, `prompt`, `setPrompt`, `onCreateQuiz`

## Dòng chảy dữ liệu

1. **Backend**: FastAPI trả về `StudyActivityOutputComplete` (EXERCISE type)
2. **API Transform**: `transformBackendQuiz()` chuyển thành mảng `QuizQuestion`
3. **Service**: `quizService.createQuiz()` gọi API
4. **Hook**: `useQuizManagement()` quản lý state danh sách
5. **Component**: `QuizPanel` render UI

## Ví dụ sử dụng

```tsx
import useQuizManagement from "@/features/quiz/hooks/useQuizManagement";
import { QuizPanel } from "@/features/quiz/components";

function MyInteractionPage() {
  const { quizzes, isLoading, createNewQuiz, removeQuiz } =
    useQuizManagement(interactionId);

  return (
    <QuizPanel
      quizzes={quizzes}
      isLoading={isLoading}
      onCreateQuiz={createNewQuiz}
      onClose={() => {}}
    />
  );
}
```

## Các features cần implement tiếp

- [ ] Submit quiz + scoring
- [ ] Show results page
- [ ] Save quiz progress
- [ ] Quiz retake logic
- [ ] Analytics/tracking
