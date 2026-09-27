import { LuArrowDown, LuRuler, LuSwatchBook } from 'react-icons/lu';

/* ── Shortcuts ────────────────────────────────────────────────────────────────
   The two things buyers most often can't decide, which size and which finish,
   asked in the buy box under its buttons. Each one takes you down to the
   chapter of the story that answers it: size & scale, or choose your finish.
   The page gives the story a slot there, so these only appear once the story
   has loaded, and only for the chapters it's showing. */

function Shortcut({ icon, question, answer, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
    >
      <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary/10 text-secondary">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-secondary">{question}</span>
        <span className="block text-[13px] text-gray-500">{answer}</span>
      </span>
      <LuArrowDown
        aria-hidden="true"
        className="size-4 shrink-0 text-gray-400 transition-transform duration-300 group-hover:translate-y-0.5 group-hover:text-accent"
      />
    </button>
  );
}

// `onSize` and `onFinish` are null when that chapter isn't on the page
export default function StoryShortcuts({ finishes, onSize, onFinish }) {
  // Canvas buyers are choosing between these two; posters ask it in general
  const canvasPair = ['rolled', 'stretched'].every((kind) => finishes.some((finish) => finish.kind === kind));

  return (
    <div className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white">
      {onSize && (
        <Shortcut
          icon={<LuRuler className="size-[18px]" />}
          question="Not sure which size?"
          answer="See it to scale"
          onClick={onSize}
        />
      )}
      {onFinish && (
        <Shortcut
          icon={<LuSwatchBook className="size-[18px]" />}
          question={canvasPair ? 'Rolled or stretched?' : 'Not sure which finish?'}
          answer="Compare the finishes"
          onClick={onFinish}
        />
      )}
    </div>
  );
}
