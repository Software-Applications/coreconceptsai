import type { PracticeTile } from "@/data/courseData";

interface PracticeCardProps {
  practice: PracticeTile;
  onClick: () => void;
}

export function PracticeCard({ practice, onClick }: PracticeCardProps) {
  const estimatedTime = Math.ceil(practice.questions * 1.5);

  return (
    <button 
      className="flex-shrink-0 w-44 text-left active:scale-[0.98] transition-all"
      onClick={onClick}
    >
      <div className={`rounded-xl overflow-hidden ${practice.color} h-28 p-3 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow`}>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">{practice.title}</p>
        </div>
        <div className="flex justify-between items-end">
          <span className="text-white/80 text-xs">{practice.questions} questions</span>
          <span className="text-white text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">
            {practice.difficulty}
          </span>
        </div>
      </div>
      <div className="mt-2">
        <p className="font-medium text-foreground text-xs">Start quiz</p>
        <p className="text-muted-foreground text-xs">~{estimatedTime} min</p>
      </div>
    </button>
  );
}
