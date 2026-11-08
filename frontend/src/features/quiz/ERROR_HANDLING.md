# Huong dan xu ly loi cho Quiz

Tai lieu nay mo ta luong hien thi loi moi cho tinh nang Quiz (trac nghiem). Muc tieu la hien thi thong bao tieng Viet de be hieu, trong khi van giu day du thong tin de dev sua loi dinh dang hoac loi server.

## 1) Backend tra loi loi theo dinh dang chung
Backend luon tra ve JSON co 3 truong:
- status_code (lay tu error.response?.status)
- exception_type (lay tu error.response?.data?.exception_type)
- message (lay tu error.response?.data?.message)

## 2) Cac file tham gia trong luong loi Quiz
- frontend/src/utils/backendError.js
  - parseBackendError: chi doc status, exception_type, message tu response
  - logBackendError: ghi log de dev xem, nhan biet loi can dev sua

- frontend/src/features/quiz/utils/quizErrorMessages.js
  - Noi chua thong bao tieng Viet theo tung action cua Quiz
  - Co the override theo status + exception_type

- frontend/src/features/quiz/utils/quizErrorHandler.js
  - resolveQuizError: ket hop parseBackendError + map thong bao quiz + log

## 3) Luong xu ly loi tong quat
1) API tra ve loi (axios throw error)
2) Hook bat error
3) Goi resolveQuizError({ action, fallbackMessage, scope })
4) Hien thi userMessage len UI
5) Neu isDeveloperFix = true thi log de dev sua

## 4) Cac action duoc ho tro cho Quiz
- loadList: tai danh sach quiz
- create: tao quiz (tu ToolSetupArea / interaction)
- loadDetail: tai chi tiet quiz
- updateMeta: cap nhat ten/mo ta quiz
- delete: xoa quiz
- submitAnswer: luu dap an
- submitQuiz: nop bai

Neu muon them action moi, them key moi trong quizErrorMessages.js

## 5) Mau su dung trong Hook

```js
import { resolveQuizError } from "../utils/quizErrorHandler";

try {
  // call API
} catch (error) {
  const { userMessage } = resolveQuizError(error, {
    action: "create",
    fallbackMessage: "Chua tao duoc bai trac nghiem. Be thu lai sau nhe.",
    scope: "useQuizManagement.createNewQuiz",
  });
  setGlobalError(userMessage);
}
```

## 6) Quy uoc dev fix vs user fix
- REQUEST_VALIDATION va INTERNAL_ERROR duoc danh dau la can dev sua
- Cac loi con lai thuong la do noi dung hoac trang thai nguoi dung

Cac flag nay duoc cai trong quizErrorMessages.js

## 7) Noi hien thong bao loi tren UI
- QuizPanel: thong bao loi tong (load list/detail/update/delete)
- QuizView: thong bao loi thao tac (submitAnswer, submitQuiz)
- ToolSetupArea: thong bao loi tao quiz

## 8) Cach cap nhat thong bao tieng Viet
- Sua tai frontend/src/features/quiz/utils/quizErrorMessages.js
- Uu tien actionOverrides cho thong bao cu the
- Neu khong co override thi dung baseByKey
