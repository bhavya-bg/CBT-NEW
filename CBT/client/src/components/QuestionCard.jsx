import Option from './Option';

export default function QuestionCard({
  question,
  selected,
  onSelect,
  currentIndex,
  total,
}) {
  const optionEntries = [
    ['A', question.options.A],
    ['B', question.options.B],
    ['C', question.options.C],
    ['D', question.options.D],
  ];

  return (
    <section className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
        Question {currentIndex + 1} of {total}
      </p>
      <h2 className="mt-3 text-xl font-semibold text-slate-900">{question.question}</h2>

      <div className="mt-6 grid gap-3">
        {optionEntries.map(([label, text]) => (
          <Option
            key={label}
            label={label}
            text={text}
            checked={selected === label}
            onSelect={() => onSelect(label)}
          />
        ))}
      </div>
    </section>
  );
}
