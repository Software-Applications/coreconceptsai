import { useState, useRef, useCallback, forwardRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { SubjectChipWithProgress } from './SubjectChipWithProgress';
import { AddSubjectSheet } from './AddSubjectSheet';
import { useUserSubjects } from '@/hooks/useUserSubjects';
import { useSubjectProgress } from '@/hooks/useSubjectProgress';
import { springTransition, cardTap, subjectChipEntry } from '@/lib/motionVariants';
import type { SubjectWithTextbook } from '@/hooks/useSubjects';
import type { DailyDownloadTopic } from '@/hooks/useTopics';

interface SubjectChipsProps {
  subjects: SubjectWithTextbook[];
  allTopics: DailyDownloadTopic[];
  selectedSubjectId: string;
  onSubjectChange: (subject: SubjectWithTextbook) => void;
}

export const SubjectChips = forwardRef<HTMLDivElement, SubjectChipsProps>(
  ({ subjects, allTopics, selectedSubjectId, onSubjectChange }, ref) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showAddSheet, setShowAddSheet] = useState(false);
    const [scrollState, setScrollState] = useState({ canScrollLeft: false, canScrollRight: false });

    // User's selected subjects (localStorage-backed)
    const {
      selectedSubjectIds,
      addSubject,
      removeSubject,
      orderedSubjectIds,
    } = useUserSubjects(subjects.map(s => s.id));

    // Progress for each subject
    const { progressBySubject } = useSubjectProgress(subjects, allTopics);

    // Filter and order subjects based on user selection
    const displayedSubjects = orderedSubjectIds
      .map(id => subjects.find(s => s.id === id))
      .filter((s): s is SubjectWithTextbook => s !== undefined);

    // Update scroll state
    const updateScrollState = useCallback(() => {
      const el = scrollRef.current;
      if (!el) return;
      
      const canScrollLeft = el.scrollLeft > 5;
      const canScrollRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 5;
      
      setScrollState({ canScrollLeft, canScrollRight });
    }, []);

    // Check scroll state on mount and resize
    useEffect(() => {
      updateScrollState();
      const el = scrollRef.current;
      if (el) {
        el.addEventListener('scroll', updateScrollState, { passive: true });
        window.addEventListener('resize', updateScrollState);
      }
      return () => {
        el?.removeEventListener('scroll', updateScrollState);
        window.removeEventListener('resize', updateScrollState);
      };
    }, [updateScrollState, displayedSubjects.length]);

    const handleAddSubject = (subjectId: string) => {
      addSubject(subjectId);
      // Auto-select the newly added subject
      const subject = subjects.find(s => s.id === subjectId);
      if (subject) {
        onSubjectChange(subject);
      }
    };

    return (
      <>
        <section className="px-4 py-2">
          <div className="relative scroll-fade-container">
            {/* Left fade gradient */}
            {scrollState.canScrollLeft && (
              <div className="scroll-fade-left" />
            )}
            
            {/* Scrollable container */}
            <div 
              ref={scrollRef} 
              className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
            >
              {/* Add button */}
              <motion.button 
                onClick={() => setShowAddSheet(true)}
                whileTap={cardTap}
                transition={springTransition}
                className="flex-shrink-0 w-12 h-12 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <Plus className="w-6 h-6 text-muted-foreground" />
              </motion.button>

              {/* Subject chips with progress */}
              <AnimatePresence mode="popLayout">
                {displayedSubjects.map((subject) => {
                  const progress = progressBySubject.get(subject.id)?.progress ?? 0;
                  return (
                    <motion.div
                      key={subject.id}
                      layout
                      initial={subjectChipEntry.initial}
                      animate={subjectChipEntry.animate}
                      exit={subjectChipEntry.exit}
                      transition={springTransition}
                    >
                      <SubjectChipWithProgress
                        subject={subject}
                        isSelected={selectedSubjectId === subject.id}
                        progress={progress}
                        onClick={() => onSubjectChange(subject)}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Right fade gradient */}
            {scrollState.canScrollRight && (
              <div className="scroll-fade-right" />
            )}
          </div>
        </section>

        {/* Add Subject Sheet */}
        <AddSubjectSheet
          isOpen={showAddSheet}
          onClose={() => setShowAddSheet(false)}
          allSubjects={subjects}
          selectedSubjectIds={selectedSubjectIds}
          onAddSubject={handleAddSubject}
          onRemoveSubject={removeSubject}
        />
      </>
    );
  }
);

SubjectChips.displayName = 'SubjectChips';
