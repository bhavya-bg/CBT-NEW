import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

function normalize(test) {
  return {
    title: test.title || 'PDF CBT Test',
    description: test.description || '',
    marksForCorrect: test.marksForCorrect || 1,
    negativeMarks: test.negativeMarks || 0,
    timerMinutes: test.timerMinutes || 10,
    questions: (test.questions || []).map((item) => ({
      _id: item._id || `${Date.now()}-${Math.random()}`,
      question: item.question || '',
      options: {
        A: item.options?.A || '',
        B: item.options?.B || '',
        C: item.options?.C || '',
        D: item.options?.D || '',
      },
      correct: item.correct || 'A',
    })),
  };
}

export default function PreviewQuestions({ onPublished }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.getTest(id);
        setForm(normalize(response.data));
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load draft test.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const totalQuestions = form?.questions?.length || 0;

  const completeness = useMemo(() => {
    if (!form || totalQuestions === 0) return 0;

    const completedCount = form.questions.filter((item) => {
      const hasQuestion = item.question.trim().length > 0;
      const hasAllOptions = ['A', 'B', 'C', 'D'].every((key) => item.options[key]?.trim());
      return hasQuestion && hasAllOptions;
    }).length;

    return Math.round((completedCount / totalQuestions) * 100);
  }, [form, totalQuestions]);

  const updateQuestion = (index, value) => {
    setForm((prev) => {
      const next = { ...prev, questions: [...prev.questions] };
      next.questions[index] = { ...next.questions[index], question: value };
      return next;
    });
  };

  const updateOption = (index, optionKey, value) => {
    setForm((prev) => {
      const next = { ...prev, questions: [...prev.questions] };
      next.questions[index] = {
        ...next.questions[index],
        options: {
          ...next.questions[index].options,
          [optionKey]: value,
        },
      };
      return next;
    });
  };

  const updateCorrect = (index, value) => {
    setForm((prev) => {
      const next = { ...prev, questions: [...prev.questions] };
      next.questions[index] = { ...next.questions[index], correct: value };
      return next;
    });
  };

  const addQuestion = () => {
    setForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          _id: `${Date.now()}-${Math.random()}`,
          question: '',
          options: { A: '', B: '', C: '', D: '' },
          correct: 'A',
        },
      ],
    }));
  };

  const deleteQuestion = (index) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== index),
    }));
  };

  const buildPayload = (publish) => ({
    title: form.title,
    description: form.description,
    marksForCorrect: form.marksForCorrect,
    negativeMarks: form.negativeMarks,
    timerMinutes: form.timerMinutes,
    questions: form.questions.map((item) => ({
      question: item.question,
      options: item.options,
      correct: item.correct,
    })),
    published: publish,
  });

  const saveDraft = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.updateTestQuestions(id, buildPayload(false));
      setMessage('Draft saved successfully.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const publishTest = async () => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await api.updateTestQuestions(id, buildPayload(true));
      onPublished(id, response.data);
      navigate(`/test/${id}`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to publish test.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-6xl p-6">Loading question preview...</div>;
  }

  if (!form) {
    return <div className="mx-auto max-w-6xl p-6 text-rose-700">{error || 'No preview data found.'}</div>;
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 md:px-6">
      <section className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-700">Question Preview</p>
            <h2 className="mt-2 font-['Sora'] text-3xl font-bold text-slate-900">Review and Edit Extracted Questions</h2>
            <p className="mt-2 text-slate-600">Add/delete/edit questions before publishing this test for students.</p>
          </div>

          <div className="rounded-2xl bg-cyan-50 px-4 py-3 text-right">
            <p className="text-sm font-semibold text-cyan-700">Completeness</p>
            <p className="text-2xl font-bold text-cyan-900">{completeness}%</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">Correct Marks</span>
            <input
              type="number"
              min="1"
              value={form.marksForCorrect}
              onChange={(event) => setForm((prev) => ({ ...prev, marksForCorrect: Number(event.target.value || 1) }))}
              className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">Negative Marks</span>
            <input
              type="number"
              min="0"
              value={form.negativeMarks}
              onChange={(event) => setForm((prev) => ({ ...prev, negativeMarks: Number(event.target.value || 0) }))}
              className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">Time Limit (minutes)</span>
            <input
              type="number"
              min="1"
              value={form.timerMinutes}
              onChange={(event) => setForm((prev) => ({ ...prev, timerMinutes: Number(event.target.value || 1) }))}
              className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={addQuestion}
            className="rounded-2xl bg-slate-800 px-5 py-2 text-sm font-bold text-white hover:bg-slate-900"
          >
            Add Question
          </button>
          <button
            type="button"
            onClick={saveDraft}
            disabled={saving}
            className="rounded-2xl bg-amber-500 px-5 py-2 text-sm font-bold text-slate-900 hover:bg-amber-400 disabled:opacity-70"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={publishTest}
            disabled={saving}
            className="rounded-2xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-70"
          >
            Publish Test
          </button>
        </div>

        {message && <p className="mt-4 rounded-xl bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-800">{message}</p>}
        {error && <p className="mt-4 rounded-xl bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p>}
      </section>

      <section className="mt-6 grid gap-4">
        {form.questions.map((item, index) => (
          <article key={item._id} className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-['Sora'] text-lg font-semibold text-slate-900">Question {index + 1}</h3>
              <button
                type="button"
                onClick={() => deleteQuestion(index)}
                className="rounded-xl bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-700 hover:bg-rose-200"
              >
                Delete
              </button>
            </div>

            <textarea
              value={item.question}
              onChange={(event) => updateQuestion(index, event.target.value)}
              rows={3}
              className="mt-3 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
              placeholder="Enter question text"
            />

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {['A', 'B', 'C', 'D'].map((label) => (
                <label key={label} className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-600">Option {label}</span>
                  <input
                    value={item.options[label]}
                    onChange={(event) => updateOption(index, label, event.target.value)}
                    className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
                  />
                </label>
              ))}
            </div>

            <label className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
              Correct Answer
              <select
                value={item.correct}
                onChange={(event) => updateCorrect(index, event.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </label>
          </article>
        ))}
      </section>
    </main>
  );
}
