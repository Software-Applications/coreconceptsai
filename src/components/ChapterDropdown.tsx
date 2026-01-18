import { useRef, useEffect, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import type { Chapter } from "@/data/courseData";

interface ChapterDropdownProps {
  chapters: Chapter[];
  selectedChapter: Chapter;
  onSelectChapter: (chapter: Chapter) => void;
}

export function ChapterDropdown({ chapters, selectedChapter, onSelectChapter }: ChapterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative mb-5" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-card border border-border rounded-xl p-3 flex items-center justify-between"
      >
        <span className="text-sm font-medium text-foreground">{selectedChapter.title}</span>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          <ul className="py-1 max-h-64 overflow-y-auto">
            {chapters.map((chapter) => (
              <li key={chapter.id}>
                <button
                  onClick={() => {
                    onSelectChapter(chapter);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-accent transition-colors ${
                    selectedChapter.id === chapter.id ? 'bg-accent' : ''
                  }`}
                >
                  <span className="font-medium text-foreground text-sm">{chapter.title}</span>
                  {selectedChapter.id === chapter.id && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
