import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthPage } from "./pages/AuthPage";
import { HomePage } from "./pages/HomePage";
import { InteractionPage } from "./pages/InteractionPage";
import QuizTestPage from "./features/quiz/QuizTestPage";

// 1. CHỐT KIỂM TRA (Protected Route)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* --- CÁC TRANG CÔNG KHAI --- */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AuthPage />} />

        {/* --- CÁC TRANG NỘI BỘ --- */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

        {/* Trang tương tác không có ID (Đang để Public) */}
        <Route path="/interaction" element={<InteractionPage />} />

        {/* Trang tương tác có ID (Bắt buộc đăng nhập) */}
        <Route
          path="/interaction/:interactionId"
          element={
            <ProtectedRoute>
              <InteractionPage />
            </ProtectedRoute>
          }
        />

      </Routes>
    </HashRouter>
  );
}

export default App;
