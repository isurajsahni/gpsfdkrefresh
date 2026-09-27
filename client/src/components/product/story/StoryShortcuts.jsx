import { LuArrowDown, LuRuler, LuSwatchBook } from 'react-icons/lu';

/* ── Shortcuts ────────────────────────────────────────────────────────────────
   The two things buyers most often can't decide, which size and which finish,
   asked side by side in the buy box, under Add to Cart. Each one takes you
   down to the chapter of the story that answers it: size & scale, or choose
   your finish. The page gives the story a slot there, so these only appear
   once the story has loaded, and only for the chapters it's showing. */

// Icon, question and arrow in a row when a shortcut has the width to itself,
// or once each half of the pair is wide enough for them (xl). Otherwise the
// icon and arrow sit above the question.
function Shortcut({ icon, question, answer, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group grid min-w-0 flex-1 grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2.5 px-4 py-3 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent only:grid-cols-[auto_1fr_auto] xl:grid-cols-[auto_1fr_auto]"
    >
      <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-secondary/10 text-secondary">
        {icon}
      </span>
      <span className="col-span-2 row-start-2 min-w-0 group-only:col-span-1 group-only:col-start-2 group-only:row-start-1 xl:col-span-1 xl:col-start-2 xl:row-start-1">
        <span className="block text-sm font-semibold text-secondary">{question}</span>
        <span className="block text-[13px] text-gray-500">{answer}</span>
      </span>
      <LuArrowDown
        aria-hidden="true"
        className="col-start-2 row-start-1 size-4 text-gray-400 transition-transform duration-300 group-hover:translate-y-0.5 group-hover:text-accent group-only:col-start-3 xl:col-start-3"
      />
    </button>
  );
}

// `onSize` and `onFinish` are null when that chapter isn't on the page
export default function StoryShortcuts({ finishes, onSize, onFinish }) {
  // Canvas buyers are choosing between these two; posters ask it in general
  const canvasPair = ['rolled', 'stretched'].every((kind) => finishes.some((finish) => finish.kind === kind));

  return (
    <div className="flex divide-x divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white">
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
