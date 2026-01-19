import { useRef, useEffect, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Chapter } from "@/data/courseData";
import { dropdownVariants, dropdownItemVariants, springTransition } from "@/lib/motionVariants";
import { useHaptics } from "@/hooks/useHaptics";

interface ChapterDropdownProps {
  chapters: Chapter[];
  selectedChapter: Chapter;
  onSelectChapter: (chapter: Chapter) => void;
}

export function ChapterDropdown({ chapters, selectedChapter, onSelectChapter }: ChapterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { lightTap, selectionChanged } = useHaptics();

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

  return (
    <div className="relative mb-5" ref={dropdownRef}>
      <motion.button 
        onClick={handleToggle}
        className="w-full bg-card border border-border rounded-xl p-3 flex items-center justify-between shadow-sm hover:shadow-md hover:border-primary/30"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        transition={springTransition}
      >
        <span className="text-sm font-medium text-foreground">{selectedChapter.title}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={springTransition}
        >
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </motion.div>
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
  );
}
