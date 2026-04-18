import { useLocation, useNavigate } from 'react-router-dom';

type ResultData = {
  score: number;
  accuracy: number;
  timeTakenSeconds: number;
  questions: Array<{
    qId: string;
    question: string;
    options: Record<'A' | 'B' | 'C' | 'D', string>;
    correct: 'A' | 'B' | 'C' | 'D';
  }>;
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>;
};

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result as ResultData | undefined;

  if (!result) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 py-12 text-slate-900">
        <p>No result data available. Return to upload page to start a test.</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="rounded-2xl bg-slate-900 px-6 py-3 text-white hover:bg-slate-700"
        >
          Go to Upload Page
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <header className="mb-8 rounded-3xl bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-semibold text-slate-900">Exam Results</h1>
        <p className="mt-2 text-slate-600">Review your score and question-wise performance.</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-lg">
          <p className="text-sm text-slate-500">Total Score</p>
          <p className="mt-3 text-4xl font-semibold text-slate-900">{result.score}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-lg">
          <p className="text-sm text-slate-500">Accuracy</p>
          <p className="mt-3 text-4xl font-semibold text-slate-900">{result.accuracy}%</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-lg">
          <p className="text-sm text-slate-500">Time Taken</p>
          <p className="mt-3 text-4xl font-semibold text-slate-900">
            {Math.floor(result.timeTakenSeconds / 60)}m {result.timeTakenSeconds % 60}s
          </p>
        </div>
      </section>

      <section className="mt-8 rounded-3xl bg-white p-8 shadow-lg">
        <h2 className="text-2xl font-semibold text-slate-900">Question-wise analysis</h2>
        <div className="mt-6 space-y-4">
          {result.questions.map((question, index) => {
            const selected = result.answers[question.qId];
            const isCorrect = selected === question.correct;
            return (
              <div key={question.qId} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-semibold text-slate-900">{index + 1}. {question.question}</p>
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${isCorrect ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
                    {isCorrect ? 'Correct' : selected ? 'Incorrect' : 'Unattempted'}
                  </span>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600">Your answer</p>
                    <p className="text-slate-900">
                      {selected ? `${selected}: ${question.options[selected]}` : 'No answer'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600">Correct answer</p>
                    <p className="text-slate-900">
                      {question.correct}: {question.options[question.correct]}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <button
        type="button"
        onClick={() => navigate('/')}
        className="mt-8 rounded-2xl bg-slate-900 px-6 py-3 text-white hover:bg-slate-700"
      >
        Create another test
      </button>
    </div>
  );
}
