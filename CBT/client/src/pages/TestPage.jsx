import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import QuestionCard from '../components/QuestionCard';
import QuestionPalette from '../components/QuestionPalette';
import Timer from '../components/Timer';
import api from '../services/api';

export default function TestPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [visited, setVisited] = useState({});
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    const loadTest = async () => {
      try {
        const response = await api.getTest(id);
        setTest(response.data);
        setRemainingSeconds((response.data.timerMinutes || 10) * 60);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load test.');
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [id]);

  useEffect(() => {
    if (!test || !test.questions?.[currentIndex]?._id) return;

    const questionId = test.questions[currentIndex]._id;
    setVisited((prev) => ({ ...prev, [questionId]: true }));
  }, [currentIndex, test]);

  useEffect(() => {
    if (loading || !test) return;
    if (remainingSeconds <= 0) {
      handleSubmit();
      return;
    }

    const timer = setTimeout(() => setRemainingSeconds((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [remainingSeconds, loading, test]);

  const currentQuestion = test?.questions?.[currentIndex];
  const hasQuestions = Boolean(test?.questions?.length);

  const handleSelectOption = (optionLabel) => {
    if (!currentQuestion?._id) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion._id]: optionLabel }));
  };

  const handleSubmit = async () => {
    if (!test?._id) return;

    const totalSeconds = (test.timerMinutes || 10) * 60;
    const timeTakenSeconds = Math.max(totalSeconds - remainingSeconds, 0);

    try {
      const response = await api.submitTest({
        testId: test._id,
        answers,
        timeTakenSeconds,
      });

      navigate('/result', { state: { result: response.data, testMeta: test } });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to submit test.');
    }
  };

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  if (loading) {
    return <div className="mx-auto max-w-6xl p-6">Loading student CBT interface...</div>;
  }

  if (!test || error) {
    return <div className="mx-auto max-w-6xl p-6 text-rose-700">{error || 'No test found.'}</div>;
  }

  if (!hasQuestions) {
    return <div className="mx-auto max-w-6xl p-6 text-rose-700">This test has no questions yet.</div>;
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 md:px-6">
      <section className="mb-6 rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-900 to-slate-800 p-6 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-100">Student Interface</p>
            <h2 className="mt-2 font-['Sora'] text-2xl font-bold">{test.title}</h2>
            <p className="mt-1 text-sm text-cyan-100">
              Marks: +{test.marksForCorrect} | -{test.negativeMarks}
            </p>
          </div>
          <Timer remainingSeconds={remainingSeconds} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          <QuestionCard
            question={currentQuestion}
            selected={answers[currentQuestion?._id]}
            onSelect={handleSelectOption}
            currentIndex={currentIndex}
            total={test.questions.length}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white p-5 shadow-lg shadow-slate-200">
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
              disabled={currentIndex === 0}
              className="rounded-2xl bg-slate-200 px-5 py-2 font-semibold text-slate-700 disabled:opacity-50"
            >
              Previous
            </button>

            {currentIndex === test.questions.length - 1 ? (
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded-2xl bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700"
              >
                Submit Test
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, test.questions.length - 1))}
                className="rounded-2xl bg-cyan-600 px-5 py-2 font-bold text-white hover:bg-cyan-700"
              >
                Next
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <QuestionPalette
            questions={test.questions}
            currentIndex={currentIndex}
            answers={answers}
            visited={visited}
            onJump={setCurrentIndex}
          />

          <div className="rounded-3xl bg-white p-4 shadow-lg shadow-slate-200">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Live Summary</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p>Total Questions: <span className="font-bold">{test.questions.length}</span></p>
              <p>Answered: <span className="font-bold text-emerald-700">{answeredCount}</span></p>
              <p>Remaining: <span className="font-bold text-amber-600">{test.questions.length - answeredCount}</span></p>
            </div>
          </div>
        </div>
      </section>

      {error && <p className="mt-4 rounded-xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
    </main>
  );
}
