import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import PreviewQuestions from './pages/PreviewQuestions.jsx';
import TestPage from './pages/TestPage.jsx';
import ResultPage from './pages/ResultPage.jsx';

function App() {
  const [draftTestId, setDraftTestId] = useState<string>(() => localStorage.getItem('cbtDraftTestId') || '');
  const [publishedTestId, setPublishedTestId] = useState<string>(() =>
    localStorage.getItem('cbtPublishedTestId') || '',
  );

  const handleDraftReady = (testId: string) => {
    setDraftTestId(testId);
    localStorage.setItem('cbtDraftTestId', testId);
  };

  const handlePublished = (testId: string) => {
    setDraftTestId(testId);
    setPublishedTestId(testId);
    localStorage.setItem('cbtDraftTestId', testId);
    localStorage.setItem('cbtPublishedTestId', testId);
  };

  return (
    <div className="min-h-screen bg-[#eef5f9] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <Navbar draftTestId={draftTestId} publishedTestId={publishedTestId} />
        <div className="flex-1">
          <Routes>
            <Route
              path="/"
              element={
                <AdminDashboard
                  onDraftReady={handleDraftReady}
                  draftTestId={draftTestId}
                  publishedTestId={publishedTestId}
                />
              }
            />
            <Route path="/preview/:id" element={<PreviewQuestions onPublished={handlePublished} />} />
            <Route path="/test/:id" element={<TestPage />} />
            <Route path="/result" element={<ResultPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
