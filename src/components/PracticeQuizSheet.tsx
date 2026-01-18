import { X, Clock, BarChart3, ChevronRight, CheckCircle2 } from "lucide-react";
import { useQuizProgress } from "@/hooks/useQuizProgress";

interface PracticeQuizSheetProps {
  quiz: {
    id: number;
    title: string;
    questions: number;
    difficulty: string;
    color: string;
  } | null;
  chapter: { id: number; title: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PracticeQuizSheet({ quiz, chapter, isOpen, onClose }: PracticeQuizSheetProps) {
  const { getCompletionPercentage, getAttemptCount, getBestScore, recordAttempt } = useQuizProgress();
  
  if (!isOpen || !quiz || !chapter) return null;

  const estimatedTime = Math.ceil(quiz.questions * 1.5);
  const completionPercentage = getCompletionPercentage(quiz.id, chapter.id);
  const attemptCount = getAttemptCount(quiz.id, chapter.id);
  const bestScore = getBestScore(quiz.id, chapter.id);
  
  const topics = [
    { name: "Concept Review", questions: Math.floor(quiz.questions * 0.4), completed: completionPercentage >= 40 },
    { name: "Application Questions", questions: Math.floor(quiz.questions * 0.35), completed: completionPercentage >= 75 },
    { name: "Critical Thinking", questions: Math.floor(quiz.questions * 0.25), completed: completionPercentage === 100 },
  ];

  const handleStartPractice = () => {
    // Simulate completing a quiz with random score for demo
    const score = Math.floor(Math.random() * (quiz.questions + 1));
    recordAttempt(quiz.id, chapter.id, score, quiz.questions);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border bg-gradient-to-b from-[hsl(var(--section-alt))] to-transparent">
        <button onClick={onClose} className="p-2 -ml-2 active:scale-95">
          <X className="w-6 h-6 text-foreground" />
        </button>
        <div className="flex-1 mx-4 text-center">
          <h2 className="font-semibold text-foreground text-sm truncate">
            {chapter?.title || "Practice Set"}
          </h2>
          <p className="text-xs text-muted-foreground">Practice Set</p>
        </div>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
        {/* Quiz Header Card */}
        <div className={`${quiz.color} rounded-2xl p-6 mb-6 shadow-lg`}>
          <h1 className="text-2xl font-bold text-white mb-3">{quiz.title}</h1>
          <div className="flex items-center gap-4 text-white/80 text-sm">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>~{estimatedTime} min</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4" />
              <span>{quiz.difficulty}</span>
            </div>
          </div>
          <div className="mt-4 bg-white/20 rounded-full px-3 py-1 inline-block">
            <span className="text-white text-sm font-medium">{quiz.questions} questions</span>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-[hsl(var(--section-alt))] rounded-xl p-4 mb-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border-t-4 border-t-emerald-500 border border-border rounded-xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-foreground">{completionPercentage}%</p>
              <p className="text-xs text-muted-foreground mt-1">Best Score</p>
            </div>
            <div className="bg-card border-t-4 border-t-blue-500 border border-border rounded-xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-foreground">
                {bestScore ? `${bestScore.score}/${bestScore.total}` : '--'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Last Score</p>
            </div>
            <div className="bg-card border-t-4 border-t-purple-500 border border-border rounded-xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-foreground">{attemptCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Attempts</p>
            </div>
          </div>
        </div>

        {/* Topics Breakdown */}
        <h3 className="font-semibold text-foreground mb-4 border-l-4 border-primary pl-3">Topics Covered</h3>
        <div className="space-y-2.5 mb-6">
          {topics.map((topic, index) => (
            <div 
              key={index}
              className={`bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm ${
                index % 2 === 1 ? 'bg-[hsl(var(--section-alt))]' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  topic.completed ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'
                }`}>
                  {topic.completed ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{topic.name}</p>
                  <p className="text-xs text-muted-foreground">{topic.questions} questions</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl p-5 mb-4 border-l-4 border-amber-400 shadow-sm">
          <h3 className="font-semibold text-foreground text-sm mb-2">💡 Study Tip</h3>
          <p className="text-sm text-muted-foreground">
            Review the related video before attempting this practice set for better understanding.
          </p>
        </div>
      </div>

      {/* Start Button */}
      <div className="p-4 border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <button 
          onClick={handleStartPractice}
          className={`w-full ${quiz.color} text-white font-semibold py-4 rounded-xl active:scale-[0.98] transition-transform shadow-lg`}
        >
          {attemptCount > 0 ? 'Practice Again' : 'Start Practice'}
        </button>
      </div>
    </div>
  );
}