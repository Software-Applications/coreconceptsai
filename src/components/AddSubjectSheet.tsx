import { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { springTransition, cardTap, fadeInUp } from '@/lib/motionVariants';
import type { SubjectWithTextbook } from '@/hooks/useSubjects';

interface AddSubjectSheetProps {
  isOpen: boolean;
  onClose: () => void;
  allSubjects: SubjectWithTextbook[];
  selectedSubjectIds: string[];
  onAddSubject: (subjectId: string) => void;
  onRemoveSubject: (subjectId: string) => void;
}

const SubjectOption = forwardRef<HTMLButtonElement, {
  subject: SubjectWithTextbook;
  isSelected: boolean;
  onToggle: () => void;
}>(({ subject, isSelected, onToggle }, ref) => (
  <motion.button
    ref={ref}
    onClick={onToggle}
    whileTap={cardTap}
    transition={springTransition}
    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
      isSelected 
        ? 'border-primary bg-primary/5' 
        : 'border-border bg-card hover:border-primary/30'
    }`}
  >
    <img 
      src={subject.image_url || ''} 
      alt={subject.name}
      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
    />
    <div className="flex-1 text-left">
      <p className="font-medium text-foreground">{subject.name}</p>
      <p className="text-xs text-muted-foreground">{subject.textbook.title}</p>
    </div>
    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
      isSelected 
        ? 'bg-primary text-primary-foreground' 
        : 'bg-muted text-muted-foreground'
    }`}>
      {isSelected ? (
        <Check className="w-4 h-4" />
      ) : (
        <Plus className="w-4 h-4" />
      )}
    </div>
  </motion.button>
));

SubjectOption.displayName = 'SubjectOption';

export const AddSubjectSheet = ({
  isOpen,
  onClose,
  allSubjects,
  selectedSubjectIds,
  onAddSubject,
  onRemoveSubject,
}: AddSubjectSheetProps) => {
  const handleToggle = (subjectId: string) => {
    if (selectedSubjectIds.includes(subjectId)) {
      // Don't allow removing the last subject
      if (selectedSubjectIds.length > 1) {
        onRemoveSubject(subjectId);
      }
    } else {
      onAddSubject(subjectId);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="bottom" 
        className="rounded-t-3xl max-h-[80vh] flex flex-col p-0"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="px-6 pb-4">
          <SheetTitle className="text-lg font-semibold text-foreground">
            Manage Subjects
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Select which subjects to show on your home screen
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-8">
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {allSubjects.map((subject, index) => (
                <motion.div
                  key={subject.id}
                  initial={fadeInUp.initial}
                  animate={fadeInUp.animate}
                  transition={{ delay: index * 0.05 }}
                >
                  <SubjectOption
                    subject={subject}
                    isSelected={selectedSubjectIds.includes(subject.id)}
                    onToggle={() => handleToggle(subject.id)}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
};
