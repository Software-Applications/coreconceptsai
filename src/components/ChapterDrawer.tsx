import { useState, forwardRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion } from "framer-motion";
import type { Chapter } from "@/hooks/useChapters";
import { springTransition } from "@/lib/motionVariants";
import { useHaptics } from "@/hooks/useHaptics";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChapterDrawerProps {
  chapters: Chapter[];
  selectedChapter: Chapter | null;
  onSelectChapter: (chapter: Chapter) => void;
  watchedCount?: number;
  totalVideos?: number;
  completedPracticeCount?: number;
  totalPractice?: number;
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

    if (!selectedChapter) return null;

    return (
      <div ref={ref} className="mb-3">
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <motion.button
              onClick={() => lightTap()}
              className="w-full bg-card border border-border rounded-xl p-3 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition={springTransition}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {selectedChapter.title}
                </span>
                <motion.div
                  animate={{ rotate: open ? 180 : 0 }}
                  transition={springTransition}
                >
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </motion.div>
              </div>
            </motion.button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[70vh]">
            <DrawerHeader className="pb-2">
              <DrawerTitle className="text-center">Select Chapter</DrawerTitle>
            </DrawerHeader>
            <ScrollArea className="flex-1 px-4 pb-6">
              <div className="space-y-1">
                {chapters.map((chapter) => (
                  <motion.button
                    key={chapter.id}
                    onClick={() => handleSelect(chapter)}
                    className={`w-full px-4 py-3.5 text-left flex items-center justify-between rounded-xl transition-colors ${
                      selectedChapter.id === chapter.id
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-accent"
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
            </ScrollArea>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }
);

ChapterDrawer.displayName = "ChapterDrawer";
