import { forwardRef } from "react";
import { X, Clock, BarChart3, ChevronRight, CheckCircle2 } from "lucide-react";
import { useQuizProgress } from "@/hooks/useQuizProgress";
import type { PracticeTile } from "@/data/courseData";
import type { Chapter } from "@/hooks/useChapters";

interface PracticeQuizSheetProps {
  quiz: PracticeTile | null;
  chapter: Chapter | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PracticeQuizSheet = forwardRef<HTMLDivElement, PracticeQuizSheetProps>(
  function PracticeQuizSheet({ quiz, chapter, isOpen, onClose }, ref) {
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
    <div ref={ref} className="absolute inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 pt-14 border-b border-border">
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
        <div className="relative rounded-xl overflow-hidden mb-6">
          <img 
            src={quiz.imageUrl} 
            alt={quiz.title}
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 p-5 flex flex-col justify-end">
            <h1 className="text-2xl font-bold text-white mb-2">{quiz.title}</h1>
            <div className="flex items-center gap-4 text-white/80 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>~{estimatedTime} min</span>
              </div>
              <div className="flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                <span>{quiz.difficulty}</span>
              </div>
            </div>
            <div className="mt-3 bg-white/20 rounded-full px-3 py-1 inline-block w-fit">
              <span className="text-white text-sm font-medium">{quiz.questions} questions</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{completionPercentage}%</p>
            <p className="text-xs text-muted-foreground">Best Score</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-foreground">
              {bestScore ? `${bestScore.score}/${bestScore.total}` : '--'}
            </p>
            <p className="text-xs text-muted-foreground">Last Score</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{attemptCount}</p>
            <p className="text-xs text-muted-foreground">Attempts</p>
          </div>
        </div>

        {/* Topics Breakdown */}
        <h3 className="font-semibold text-foreground mb-3">Topics Covered</h3>
        <div className="space-y-2 mb-6">
          {topics.map((topic, index) => (
            <div 
              key={index}
              className="bg-card border border-border rounded-xl p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
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
        <div className="bg-accent rounded-xl p-4 mb-4">
          <h3 className="font-semibold text-foreground text-sm mb-2">💡 Study Tip</h3>
          <p className="text-sm text-muted-foreground">
            Review the related video before attempting this practice set for better understanding.
          </p>
        </div>
      </div>

      {/* Start Button */}
      <div className="p-4 border-t border-border">
        <button 
          onClick={handleStartPractice}
          className={`w-full ${quiz.color} text-white font-semibold py-4 rounded-xl active:scale-[0.98] transition-transform`}
        >
          {attemptCount > 0 ? 'Practice Again' : 'Start Practice'}
        </button>
      </div>
    </div>
  );
});
