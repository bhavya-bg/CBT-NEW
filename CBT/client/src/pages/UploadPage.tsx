import { useState, FormEvent } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function UploadPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [title, setTitle] = useState('PDF CBT Test');
  const [description, setDescription] = useState('Generated from uploaded PDF');
  const [marksForCorrect, setMarksForCorrect] = useState(1);
  const [negativeMarks, setNegativeMarks] = useState(0);
  const [timerMinutes, setTimerMinutes] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!pdfFile) {
      setError('Please upload a PDF first.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('marksForCorrect', String(marksForCorrect));
      formData.append('negativeMarks', String(negativeMarks));
      formData.append('timerMinutes', String(timerMinutes));

      const response = await axios.post(`${API_URL}/upload-pdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigate(`/exam/${response.data.testId}`, {
        state: { test: response.data.test },
      });
    } catch (uploadError: unknown) {
      const message =
        axios.isAxiosError(uploadError) && uploadError.response?.data?.message
          ? String(uploadError.response.data.message)
          : 'Upload failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <header className="mb-10 rounded-3xl bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-semibold text-slate-900">PDF to CBT Exam System</h1>
        <p className="mt-2 text-slate-600">
          Upload your MCQ PDF, set scoring and timer, then publish the test.
        </p>
      </header>

      <main className="space-y-8">
        <section className="rounded-3xl bg-white p-8 shadow-lg">
          <h2 className="text-2xl font-semibold text-slate-900">Admin Panel</h2>
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <label className="block">
                <span className="text-slate-700">Test Title</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-slate-500 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-slate-700">Description</span>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-slate-500 focus:outline-none"
                />
              </label>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <label className="block">
                <span className="text-slate-700">Marks for correct</span>
                <input
                  type="number"
                  value={marksForCorrect}
                  onChange={(e) => setMarksForCorrect(Number(e.target.value))}
                  min="0"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-slate-500 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-slate-700">Negative marks</span>
                <input
                  type="number"
                  value={negativeMarks}
                  onChange={(e) => setNegativeMarks(Number(e.target.value))}
                  min="0"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-slate-500 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-slate-700">Timer (minutes)</span>
                <input
                  type="number"
                  value={timerMinutes}
                  onChange={(e) => setTimerMinutes(Number(e.target.value))}
                  min="1"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-slate-500 focus:outline-none"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-slate-700">Upload PDF</span>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                className="mt-2 w-full text-slate-700"
              />
            </label>

            {error && (
              <p className="rounded-2xl bg-rose-100 px-4 py-3 text-rose-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Publishing...' : 'Upload & Publish Test'}
            </button>
          </form>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-8 shadow-lg">
            <h3 className="text-xl font-semibold text-slate-900">How it works</h3>
            <ul className="mt-4 space-y-3 text-slate-600">
              <li>1. Upload MCQ PDF containing questions and options.</li>
              <li>2. The backend parses text and extracts structured questions.</li>
              <li>3. Start the exam immediately after upload.</li>
            </ul>
          </div>
          <div className="rounded-3xl bg-white p-8 shadow-lg">
            <h3 className="text-xl font-semibold text-slate-900">Notes</h3>
            <p className="mt-4 text-slate-600">
              The system supports basic PDF text extraction and will fall back to sample questions if extraction fails.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
