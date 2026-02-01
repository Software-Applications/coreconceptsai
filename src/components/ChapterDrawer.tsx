import { useState, forwardRef } from "react";
import { createPortal } from "react-dom";
import { List, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Chapter } from "@/hooks/useChapters";
import { springTransition } from "@/lib/motionVariants";
import { useHaptics } from "@/hooks/useHaptics";

interface ChapterDrawerProps {
  chapters: Chapter[];
  selectedChapter: Chapter | null;
  onSelectChapter: (chapter: Chapter) => void;
}

export const ChapterDrawer = forwardRef<HTMLDivElement, ChapterDrawerProps>(
  ({ chapters, selectedChapter, onSelectChapter }, ref) => {
    const [open, setOpen] = useState(false);
    const { lightTap, selectionChanged } = useHaptics();

    const handleSelect = (chapter: Chapter) => {
      selectionChanged();
      onSelectChapter(chapter);
      setOpen(false);
    };

    const handleClose = () => {
      lightTap();
      setOpen(false);
    };

    if (!selectedChapter) return null;

    // Find the mobile frame container for the portal
    const portalContainer = document.querySelector('[data-mobile-frame]') || document.body;

    const drawerContent = (
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />

            {/* Drawer Content */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl max-h-[60%] flex flex-col"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={springTransition}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3">
                <h2 className="text-lg font-semibold text-foreground">
                  Select Chapter
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Chapter List - native scroll */}
              <div 
                className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6 scrollbar-hide"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                <div className="space-y-1.5">
                  {chapters.map((chapter) => (
                    <motion.button
                      key={chapter.id}
                      onClick={() => handleSelect(chapter)}
                      className={`w-full px-4 py-3.5 text-left flex items-center justify-between rounded-xl transition-colors ${
                        selectedChapter.id === chapter.id
                          ? "bg-primary/10 border border-primary/20"
                          : "bg-card border border-border hover:bg-accent hover:border-primary/20"
                      }`}
                      whileTap={{ scale: 0.98 }}
                      transition={springTransition}
                    >
                      <span
                        className={`font-medium text-sm ${
                          selectedChapter.id === chapter.id
                            ? "text-primary"
                            : "text-foreground"
                        }`}
                      >
                        {chapter.title}
                      </span>
                      {selectedChapter.id === chapter.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={springTransition}
                        >
                          <Check className="w-4 h-4 text-primary" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );

    return (
      <div ref={ref} className="mb-3">
        {/* Trigger Button */}
        <motion.button
          onClick={() => { lightTap(); setOpen(true); }}
          className="w-full bg-card border border-border rounded-xl px-3 py-2.5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          transition={springTransition}
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Select Chapter
              </span>
              <span className="text-sm font-medium text-foreground">
                {selectedChapter.title}
              </span>
            </div>
            <List className="w-4 h-4 text-muted-foreground" />
          </div>
        </motion.button>

        {/* Portal the drawer to mobile frame root */}
        {createPortal(drawerContent, portalContainer)}
      </div>
    );
  }
);

ChapterDrawer.displayName = "ChapterDrawer";
