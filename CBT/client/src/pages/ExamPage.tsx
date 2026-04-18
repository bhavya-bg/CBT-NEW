import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

type OptionLabel = 'A' | 'B' | 'C' | 'D';

type Question = {
  qId: string;
  question: string;
  options: string[];
  correct: OptionLabel;
};

type TestData = {
  timerMinutes: number;
  questions: Array<{
    _id?: string;
    question: string;
    options: {
      A: string;
      B: string;
      C: string;
      D: string;
    };
    correct: OptionLabel;
  }>;
};

type AnswerMap = Record<string, OptionLabel>;

type LocationState = {
  test?: TestData;
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const normalizeQuestions = (items: TestData['questions']): Question[] =>
  items.map((item) => ({
    qId: item._id?.toString() || item.question,
    question: item.question,
    options: [item.options.A, item.options.B, item.options.C, item.options.D],
    correct: item.correct,
  }));

const optionLabels: OptionLabel[] = ['A', 'B', 'C', 'D'];

export default function ExamPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [test, setTest] = useState<TestData | null>(location.state?.test || null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    const loadTest = async () => {
      try {
        const source =
          test || (await axios.get<TestData>(`${API_URL}/test/${id}`)).data;
        if (!source) {
          setError('Test data was not found.');
          return;
        }

        setTest(source);
        setQuestions(shuffleArray(normalizeQuestions(source.questions || [])));
        setRemainingSeconds(source.timerMinutes * 60);
      } catch (fetchError: unknown) {
        const message =
          axios.isAxiosError(fetchError) && fetchError.response?.data?.message
            ? String(fetchError.response.data.message)
            : 'Failed to load test.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [id, test]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        alert('Tab switching detected. Keep the test focused in this tab.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!loading && remainingSeconds <= 0) {
      handleSubmit();
      return;
    }

    const timer = setTimeout(() => setRemainingSeconds((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [remainingSeconds, loading]);

  const handleOption = (index: number) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.qId]: optionLabels[index],
    }));
  };

  const handleSubmit = async () => {
    if (!test) return;
    const timeTakenSeconds = test.timerMinutes * 60 - remainingSeconds;
    try {
      const response = await axios.post(`${API_URL}/submit-test`, {
        testId: id,
        answers,
        timeTakenSeconds,
      });
      navigate('/result', { state: { result: response.data } });
    } catch (submitError: unknown) {
      const message =
        axios.isAxiosError(submitError) && submitError.response?.data?.message
          ? String(submitError.response.data.message)
          : 'Failed to submit test.';
      setError(message);
    }
  };

  const attemptStatus = useMemo(
    () =>
      questions.map((question, index) => ({
        index,
        status: answers[question.qId] ? 'attempted' : 'unattempted',
      })),
    [answers, questions],
  );

  const wrongCount = useMemo(
    () =>
      questions.filter(
        (question) =>
          answers[question.qId] && answers[question.qId] !== question.correct,
      ).length,
    [answers, questions],
  );

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading test...</div>;
  }

  if (error) {
    return <div className="flex min-h-screen items-center justify-center text-rose-700">{error}</div>;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-6">
      <div className="rounded-3xl bg-white p-6 shadow-lg">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">CBT Exam</h1>
            <p className="text-slate-600">Answer each MCQ and navigate through the test.</p>
          </div>
          <div className="rounded-3xl bg-slate-50 px-4 py-3 text-slate-700 shadow-sm">
            {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')}
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Question {currentIndex + 1} of {questions.length}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">{currentQuestion?.question}</h2>
          </div>
          <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-700">
            Selected: {answers[currentQuestion?.qId || ''] ?? 'None'}
          </div>
        </div>

        <div className="space-y-3">
          {currentQuestion?.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleOption(i)}
              className={`w-full text-left p-3 border rounded-xl transition ${
                answers[currentQuestion.qId] === optionLabels[i]
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-gray-50 text-slate-900 border-slate-200 hover:border-slate-400'
              }`}
            >
              <span className="font-semibold">{optionLabels[i]}.</span> {opt}
            </button>
          ))}
        </div>

        <div className="flex justify-between mt-6">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
            className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>

          {currentIndex === questions.length - 1 ? (
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-500 text-white rounded-lg"
            >
              Submit
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              Next
            </button>
          )}
        </div>

        <div className="grid grid-cols-5 gap-2 mt-6">
          {questions.map((question, i) => (
            <button
              type="button"
              key={question.qId}
              onClick={() => setCurrentIndex(i)}
              className={`p-2 rounded-lg text-sm font-semibold ${
                answers[question.qId] !== undefined
                  ? 'bg-green-400 text-slate-900'
                  : 'bg-gray-300 text-slate-700'
              } ${i === currentIndex ? 'ring-2 ring-slate-700' : ''}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-lg">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-slate-50 p-4 text-center">
            <p className="text-sm text-slate-500">Answered</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{Object.keys(answers).length}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4 text-center">
            <p className="text-sm text-slate-500">Remaining</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{questions.length - Object.keys(answers).length}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4 text-center">
            <p className="text-sm text-slate-500">Incorrect</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{wrongCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
