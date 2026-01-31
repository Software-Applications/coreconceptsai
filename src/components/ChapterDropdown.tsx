import { useRef, useEffect, useState, forwardRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Chapter } from "@/hooks/useChapters";
import { dropdownVariants, dropdownItemVariants, springTransition } from "@/lib/motionVariants";
import { useHaptics } from "@/hooks/useHaptics";

interface ChapterDropdownProps {
  chapters: Chapter[];
  selectedChapter: Chapter | null;
  onSelectChapter: (chapter: Chapter) => void;
  watchedCount?: number;
  totalVideos?: number;
  completedPracticeCount?: number;
  totalPractice?: number;
}

export const ChapterDropdown = forwardRef<HTMLDivElement, ChapterDropdownProps>(
  ({ chapters, selectedChapter, onSelectChapter, watchedCount = 0, totalVideos = 0, completedPracticeCount = 0, totalPractice = 0 }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { lightTap, selectionChanged } = useHaptics();
    
    // Calculate combined progress
    const totalItems = totalVideos + totalPractice;
    const completedItems = watchedCount + completedPracticeCount;
    const progressPercent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggle = () => {
      lightTap();
      setIsOpen(!isOpen);
    };

    const handleSelect = (chapter: Chapter) => {
      selectionChanged();
      onSelectChapter(chapter);
      setIsOpen(false);
    };

    if (!selectedChapter) return null;
    
    return (
      <div ref={ref} className="relative mb-3">
        <div ref={dropdownRef}>
          <motion.button 
            onClick={handleToggle}
            className="w-full bg-card border border-border rounded-xl p-3 shadow-sm hover:shadow-md hover:border-primary/30"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={springTransition}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{selectedChapter.title}</span>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={springTransition}
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </div>
            {/* Progress Bar */}
            {totalItems > 0 && (
              <div className="mt-2">
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {completedItems} of {totalItems} completed
                </p>
              </div>
            )}
          </motion.button>
          
          <AnimatePresence>
            {isOpen && (
              <motion.div 
                className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <ul className="py-1 max-h-64 overflow-y-auto">
                  {chapters.map((chapter) => (
                    <motion.li 
                      key={chapter.id}
                      variants={dropdownItemVariants}
                    >
                      <button
                        onClick={() => handleSelect(chapter)}
                        className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-accent transition-colors ${
                          selectedChapter.id === chapter.id ? 'bg-accent' : ''
                        }`}
                      >
                        <span className="font-medium text-foreground text-sm">{chapter.title}</span>
                        {selectedChapter.id === chapter.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={springTransition}
                          >
                            <Check className="w-4 h-4 text-primary" />
                          </motion.div>
                        )}
                      </button>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }
);

ChapterDropdown.displayName = 'ChapterDropdown';
