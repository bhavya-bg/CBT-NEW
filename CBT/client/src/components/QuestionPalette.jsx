export default function QuestionPalette({
  questions,
  currentIndex,
  answers,
  visited,
  onJump,
}) {
  const getStatus = (questionId) => {
    if (answers[questionId]) return 'answered';
    if (visited[questionId]) return 'visited';
    return 'unvisited';
  };

  const classByStatus = {
    answered: 'bg-emerald-500 text-white',
    visited: 'bg-amber-400 text-slate-900',
    unvisited: 'bg-slate-200 text-slate-700',
  };

  return (
    <aside className="rounded-3xl bg-white p-4 shadow-xl shadow-slate-200">
      <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Question Palette</h3>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {questions.map((question, index) => {
          const status = getStatus(question._id);
          return (
            <button
              key={question._id}
              type="button"
              onClick={() => onJump(index)}
              className={`rounded-xl px-2 py-2 text-sm font-bold transition ${classByStatus[status]} ${
                index === currentIndex ? 'ring-2 ring-slate-900 ring-offset-2' : ''
              }`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
        <span className="rounded-full bg-emerald-100 px-3 py-1">Answered</span>
        <span className="rounded-full bg-amber-100 px-3 py-1">Visited</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">Unvisited</span>
      </div>
    </aside>
  );
}
