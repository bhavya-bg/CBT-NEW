import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function AdminDashboard({ onDraftReady, draftTestId, publishedTestId }) {
  const navigate = useNavigate();
  const [pdfFile, setPdfFile] = useState(null);
  const [title, setTitle] = useState('Hackathon CBT Challenge');
  const [description, setDescription] = useState('Auto-generated test from PDF with AI parser');
  const [marksForCorrect, setMarksForCorrect] = useState(4);
  const [negativeMarks, setNegativeMarks] = useState(1);
  const [timerMinutes, setTimerMinutes] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalQuestions = 48;
  const totalCourses = 12;
  const activeExam = publishedTestId ? 1 : 0;

  const handleGenerate = async (event) => {
    event.preventDefault();
    if (!pdfFile) {
      setError('Please upload a PDF before generating test.');
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

      const response = await api.uploadPdf(formData);
      onDraftReady(response.data.testId, response.data.test);
      navigate(`/preview/${response.data.testId}`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to generate test from PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto w-full px-4 py-6 md:px-6">
      <section className="rounded-[28px] bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-500">Good morning admin, welcome back.</p>
            <h2 className="mt-1 font-['Sora'] text-2xl font-bold text-slate-900">CBT Dashboard Overview</h2>
            <p className="mt-1 text-sm text-slate-500">Manage your tests, questions, and live exam flow from one panel.</p>
          </div>
          <button
            type="button"
            onClick={() => document.getElementById('create-test-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600"
          >
            Quick Create
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Total Projects', value: totalCourses, tone: 'bg-cyan-50 text-cyan-700' },
            { label: 'Total Questions', value: totalQuestions, tone: 'bg-violet-50 text-violet-700' },
            { label: 'Active Exam', value: activeExam, tone: 'bg-emerald-50 text-emerald-700' },
            { label: 'Draft Ready', value: draftTestId ? 1 : 0, tone: 'bg-amber-50 text-amber-700' },
            { label: 'Published', value: publishedTestId ? 1 : 0, tone: 'bg-blue-50 text-blue-700' },
            { label: 'Timer Minutes', value: timerMinutes, tone: 'bg-rose-50 text-rose-700' },
          ].map((card) => (
            <article key={card.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className={`inline-flex rounded-lg px-2 py-1 text-xs font-semibold ${card.tone}`}>{card.label}</div>
              <p className="mt-3 text-2xl font-extrabold text-slate-900">{card.value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[2.2fr,1fr]">
        <article id="create-test-form" className="rounded-[28px] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Create New Test</p>
              <h3 className="mt-1 font-['Sora'] text-xl font-bold text-slate-900">Upload PDF and Generate Question Set</h3>
            </div>
            <span className="rounded-full bg-[#1f2f4f] px-3 py-1 text-xs font-bold text-white">Admin Mode</span>
          </div>

          <form onSubmit={handleGenerate} className="mt-5 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Upload PDF</span>
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => setPdfFile(event.target.files?.[0] || null)}
                className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">Test Title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">Description</span>
                <input
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">Correct marks (+)</span>
                <input
                  type="number"
                  min="1"
                  value={marksForCorrect}
                  onChange={(event) => setMarksForCorrect(Number(event.target.value || 1))}
                  className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">Negative marks (-)</span>
                <input
                  type="number"
                  min="0"
                  value={negativeMarks}
                  onChange={(event) => setNegativeMarks(Number(event.target.value || 0))}
                  className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">Time limit (minutes)</span>
                <input
                  type="number"
                  min="1"
                  value={timerMinutes}
                  onChange={(event) => setTimerMinutes(Number(event.target.value || 1))}
                  className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
                />
              </label>
            </div>

            {error && <p className="rounded-2xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-sky-500 px-6 py-3 text-sm font-bold text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Generating...' : 'Generate Test'}
              </button>

              <button
                type="button"
                disabled={!draftTestId}
                onClick={() => navigate(`/preview/${draftTestId}`)}
                className="rounded-2xl bg-[#1f2f4f] px-6 py-3 text-sm font-bold text-white hover:bg-[#16253d] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Open Preview
              </button>

              <button
                type="button"
                disabled={!publishedTestId}
                onClick={() => navigate(`/test/${publishedTestId}`)}
                className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Start Student Test
              </button>
            </div>
          </form>
        </article>

        <aside className="space-y-5">
          <div className="rounded-[28px] bg-white p-5 shadow-sm">
            <h4 className="font-['Sora'] text-lg font-bold text-slate-900">Flow Mapping</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>1. PDF upload and extraction</li>
              <li>2. Edit questions in preview</li>
              <li>3. Publish and open student exam</li>
              <li>4. Submit and review result analytics</li>
            </ul>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-sm">
            <h4 className="font-['Sora'] text-lg font-bold text-slate-900">Quick Navigation</h4>
            <div className="mt-3 grid gap-2">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-xl bg-slate-100 px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Dashboard Home
              </button>
              <button
                type="button"
                disabled={!draftTestId}
                onClick={() => navigate(`/preview/${draftTestId}`)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-40"
              >
                Question Preview
              </button>
              <button
                type="button"
                disabled={!publishedTestId}
                onClick={() => navigate(`/test/${publishedTestId}`)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-40"
              >
                Student Test Panel
              </button>
              <button
                type="button"
                onClick={() => navigate('/result')}
                className="rounded-xl bg-slate-100 px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Result Screen
              </button>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
