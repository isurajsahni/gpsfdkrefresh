import {
  LuAward, LuClock, LuDroplet, LuFeather, LuFlaskConical, LuFrame, LuGlobe, LuRotateCcw,
  LuShieldCheck, LuShowerHead, LuSun, LuTruck, LuWaves, LuWrench,
} from 'react-icons/lu';

const ICONS = {
  truck: LuTruck,
  clock: LuClock,
  shield: LuShieldCheck,
  returns: LuRotateCcw,
  globe: LuGlobe,
  cloth: LuDroplet,
  water: LuShowerHead,
  chemicals: LuFlaskConical,
  dust: LuFeather,
  sun: LuSun,
  damp: LuWaves,
  plate: LuFrame,
  kit: LuWrench,
  certificate: LuAward,
};

// Care rules that say "don't": the icon gets struck through
const STRUCK = new Set(['water', 'chemicals']);

export default function StoryIcon({ name, className = 'size-5' }) {
  const Icon = ICONS[name];
  if (!Icon) return null;
  return (
    <span className="relative inline-grid place-items-center" aria-hidden="true">
      <Icon className={className} strokeWidth={1.6} />
      {STRUCK.has(name) && (
        <span className="absolute left-1/2 top-1/2 h-[1.6px] w-[135%] -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-current" />
      )}
    </span>
  );
}
