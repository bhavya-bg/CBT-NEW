import { NavLink, useLocation } from 'react-router-dom';

function buildLink(basePath, testId) {
  if (!testId) return '';
  return `${basePath}/${testId}`;
}

export default function Navbar({ draftTestId, publishedTestId }) {
  const location = useLocation();

  const links = [
    { label: 'Dashboard', to: '/', icon: '▦' },
    { label: 'Question Preview', to: buildLink('/preview', draftTestId || publishedTestId), icon: '▤' },
    { label: 'Student Test', to: buildLink('/test', publishedTestId || draftTestId), icon: '◫' },
    { label: 'Results', to: '/result', icon: '◷' },
  ];

  return (
    <aside className="sticky top-0 h-screen w-full border-r border-slate-200/70 bg-[#f8fbff] px-4 py-5 lg:w-64">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-700">Menu</p>
          <h1 className="mt-1 font-['Sora'] text-lg font-semibold text-slate-900">CBT Admin Panel</h1>
          <p className="mt-1 text-xs text-slate-500">Control tests, preview questions and publish exams.</p>
        </div>
      </div>

      <nav className="mt-6 space-y-2">
        {links.map((link) => {
          const disabled = !link.to;
          return (
            <NavLink
              key={link.label}
              to={disabled ? location.pathname : link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  disabled
                    ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                    : isActive
                      ? 'bg-[#1f2f4f] text-white shadow-md'
                      : 'bg-white text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-slate-100 text-xs text-slate-700">
                {link.icon}
              </span>
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-8 rounded-3xl bg-[#1f2f4f] p-4 text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">Quick Status</p>
        <div className="mt-3 space-y-2 text-sm">
          <p className="rounded-xl bg-white/10 px-3 py-2">
            Draft Test: <span className="font-bold">{draftTestId ? 'Ready' : 'Pending'}</span>
          </p>
          <p className="rounded-xl bg-white/10 px-3 py-2">
            Published: <span className="font-bold">{publishedTestId ? 'Yes' : 'No'}</span>
          </p>
        </div>
      </div>
    </aside>
  );
}
