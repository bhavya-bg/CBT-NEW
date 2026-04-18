import { useLocation, useNavigate } from 'react-router-dom';

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const result = location.state?.result;

  if (!result) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <div className="rounded-3xl bg-white p-8 text-center shadow-xl shadow-slate-200">
          <h2 className="font-['Sora'] text-2xl font-bold text-slate-900">No Result Data</h2>
          <p className="mt-2 text-slate-600">Attempt a test first to view analytics and question review.</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-6 rounded-2xl bg-cyan-600 px-6 py-3 font-bold text-white hover:bg-cyan-700"
          >
            Go to Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 md:px-6">
      <section className="rounded-3xl bg-white p-6 shadow-xl shadow-cyan-100">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-700">Result Overview</p>
        <h2 className="mt-2 font-['Sora'] text-3xl font-bold text-slate-900">Performance Analytics</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-cyan-50 p-4">
            <p className="text-sm text-cyan-800">Total Marks</p>
            <p className="mt-1 text-3xl font-bold text-cyan-900">{result.score}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-sm text-emerald-800">Correct</p>
            <p className="mt-1 text-3xl font-bold text-emerald-900">{result.correctCount}</p>
          </div>
          <div className="rounded-2xl bg-rose-50 p-4">
            <p className="text-sm text-rose-700">Incorrect</p>
            <p className="mt-1 text-3xl font-bold text-rose-800">{result.incorrectCount}</p>
          </div>
          <div className="rounded-2xl bg-amber-50 p-4">
            <p className="text-sm text-amber-700">Unattempted</p>
            <p className="mt-1 text-3xl font-bold text-amber-800">{result.unansweredCount}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-100 p-4">
            <p className="text-sm text-slate-600">Accuracy</p>
            <p className="text-2xl font-bold text-slate-900">{result.accuracy}%</p>
          </div>
          <div className="rounded-2xl bg-slate-100 p-4">
            <p className="text-sm text-slate-600">Time Taken</p>
            <p className="text-2xl font-bold text-slate-900">
              {Math.floor(result.timeTakenSeconds / 60)}m {result.timeTakenSeconds % 60}s
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
        <h3 className="font-['Sora'] text-2xl font-semibold text-slate-900">Question Wise Review</h3>
        <div className="mt-4 space-y-4">
          {result.questions.map((question, index) => {
            const selected = result.answers?.[question.qId];
            const status = !selected
              ? 'Unattempted'
              : selected === question.correct
                ? 'Correct'
                : 'Incorrect';

            return (
              <article key={question.qId} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-semibold text-slate-900">Q{index + 1}. {question.question}</h4>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      status === 'Correct'
                        ? 'bg-emerald-100 text-emerald-800'
                        : status === 'Incorrect'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {status}
                  </span>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    Your answer: {selected ? `${selected} - ${question.options[selected]}` : 'Not attempted'}
                  </p>
                  <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    Correct answer: {question.correct} - {question.options[question.correct]}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <button
        type="button"
        onClick={() => navigate('/')}
        className="mt-6 rounded-2xl bg-slate-900 px-6 py-3 font-bold text-white hover:bg-slate-800"
      >
        Create New Test
      </button>
    </main>
  );
}
