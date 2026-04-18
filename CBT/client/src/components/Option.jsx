export default function Option({ label, text, checked, onSelect }) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
        checked
          ? 'border-cyan-500 bg-cyan-50 shadow-md shadow-cyan-100'
          : 'border-slate-200 bg-white hover:border-cyan-300'
      }`}
    >
      <input
        type="radio"
        name="question-option"
        checked={checked}
        onChange={onSelect}
        className="mt-1 h-4 w-4 accent-cyan-600"
      />
      <span className="text-sm font-semibold text-slate-600">{label}.</span>
      <span className="text-slate-800">{text}</span>
    </label>
  );
}
