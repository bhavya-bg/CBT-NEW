import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const shuffleArray = (array) => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const normalizeQuestions = (items) =>
  items.map((item) => ({
    qId: item._id?.toString() || item.question,
    question: item.question,
    options: item.options,
    correct: item.correct,
  }));

export default function ExamPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [test, setTest] = useState(location.state?.test || null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentQuestion = questions[currentIndex] || {};

  useEffect(() => {
    const loadTest = async () => {
      try {
        const source = test || (await axios.get(`${API_URL}/test/${id}`)).data;
        if (!source) {
          setError("Test data was not found.");
          return;
        }
        setTest(source);
        const normalized = normalizeQuestions(source.questions || []);
        setQuestions(shuffleArray(normalized));
        setRemainingSeconds(source.timerMinutes * 60);
      } catch (fetchError) {
        setError(fetchError.response?.data?.message || "Failed to load test.");
      } finally {
        setLoading(false);
      }
    };
    loadTest();
  }, [id, test]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        alert("Tab switching detected. Keep the test focused in this tab.");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!loading && remainingSeconds <= 0) {
      handleSubmit();
      return;
    }
    const timer = setTimeout(
      () => setRemainingSeconds((prev) => prev - 1),
      1000,
    );
    return () => clearTimeout(timer);
  }, [remainingSeconds, loading]);

  const handleSelect = (choice) => {
    if (!currentQuestion.qId) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.qId]: choice }));
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
      navigate("/result", { state: { result: response.data } });
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Failed to submit test.");
    }
  };

  const attemptStatus = useMemo(
    () =>
      questions.map((item, index) => ({
        index,
        status: answers[item.qId] ? "attempted" : "unattempted",
      })),
    [answers, questions],
  );

  const wrongCount = useMemo(
    () =>
      questions.filter(
        (item) => answers[item.qId] && answers[item.qId] !== item.correct,
      ).length,
    [answers, questions],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading test...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-rose-700">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-6">
      <header className="rounded-3xl bg-white p-6 shadow-lg">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Exam Interface
            </h1>
            <p className="text-slate-600">
              Answer one question at a time. Timer auto-submits when it reaches
              zero.
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 px-4 py-3 text-slate-700 shadow-sm">
            Time left:{" "}
            <span className="font-semibold">
              {Math.floor(remainingSeconds / 60)}:
              {String(remainingSeconds % 60).padStart(2, "0")}
            </span>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                Question {currentIndex + 1} of {questions.length}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">
                {currentQuestion.question}
              </h2>
            </div>
            <button
              onClick={handleSubmit}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-white transition hover:bg-slate-700"
            >
              Submit Exam
            </button>
          </div>

          <div className="space-y-4">
            {["A", "B", "C", "D"].map((optionKey) => (
              <label
                key={optionKey}
                className="block rounded-3xl border border-slate-200 bg-slate-50 p-4 hover:border-slate-400"
              >
                <input
                  type="radio"
                  name="answer"
                  value={optionKey}
                  checked={answers[currentQuestion.qId] === optionKey}
                  onChange={() => handleSelect(optionKey)}
                  className="mr-3 h-5 w-5 text-slate-900"
                />
                <span className="font-semibold">{optionKey}.</span>{" "}
                {currentQuestion.options[optionKey]}
              </label>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
              disabled={currentIndex === 0}
              className="w-full rounded-2xl bg-slate-100 px-5 py-3 text-slate-700 transition hover:bg-slate-200 disabled:opacity-50 sm:w-auto"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentIndex((prev) =>
                  Math.min(prev + 1, questions.length - 1),
                )
              }
              disabled={currentIndex === questions.length - 1}
              className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-white transition hover:bg-slate-700 disabled:opacity-50 sm:w-auto"
            >
              Next
            </button>
          </div>
        </section>

        <aside className="rounded-3xl bg-white p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-slate-900">
            Question Palette
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {attemptStatus.map((item) => (
              <button
                key={item.index}
                onClick={() => setCurrentIndex(item.index)}
                className={`rounded-2xl px-3 py-2 text-sm font-semibold transition ${
                  item.index === currentIndex
                    ? "bg-slate-900 text-white"
                    : item.status === "attempted"
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-slate-100 text-slate-700"
                }`}
              >
                Q{item.index + 1}
              </button>
            ))}
          </div>
          <div className="mt-6 space-y-3 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              <span className="font-semibold">Answered:</span>{" "}
              {Object.keys(answers).length}
            </p>
            <p>
              <span className="font-semibold">Remaining:</span>{" "}
              {questions.length - Object.keys(answers).length}
            </p>
            <p>
              <span className="font-semibold">Marked wrong:</span> {wrongCount}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
