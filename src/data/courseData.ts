export interface Subject {
  id: number;
  name: string;
  color: string;
}

export interface VideoTile {
  id: number;
  title: string;
  author: string;
  duration: string;
  gradient: string;
}

export interface PracticeTile {
  id: number;
  title: string;
  questions: number;
  difficulty: string;
  color: string;
}

export interface Chapter {
  id: number;
  title: string;
}

export const subjects: Subject[] = [
  { id: 1, name: "Microbiology", color: "bg-slate-700" },
  { id: 2, name: "Chemistry", color: "bg-slate-600" },
  { id: 3, name: "Biology", color: "bg-slate-700" },
];

export const videoTiles: VideoTile[] = [
  { id: 1, title: "Introduction to Microbiology", author: "Jason Amores", duration: "12:34", gradient: "from-slate-700 to-slate-600" },
  { id: 2, title: "Gram Staining Techniques", author: "Dr. Emily Park", duration: "08:22", gradient: "from-slate-600 to-slate-500" },
  { id: 3, title: "Antibiotic Resistance", author: "Dr. Lisa Wong", duration: "15:47", gradient: "from-slate-700 to-slate-600" },
  { id: 4, title: "Immune System Response", author: "Dr. Rachel Kim", duration: "11:05", gradient: "from-slate-600 to-slate-500" },
  { id: 5, title: "Bacterial Growth Phases", author: "Dr. Mike Chen", duration: "09:18", gradient: "from-slate-700 to-slate-600" },
];

export const practiceTiles: PracticeTile[] = [
  { id: 1, title: "Cell Structure Quiz", questions: 15, difficulty: "Easy", color: "bg-slate-700" },
  { id: 2, title: "Bacterial Identification", questions: 20, difficulty: "Medium", color: "bg-slate-800" },
  { id: 3, title: "Virology Concepts", questions: 12, difficulty: "Hard", color: "bg-slate-700" },
  { id: 4, title: "Antibiotic Mechanisms", questions: 18, difficulty: "Medium", color: "bg-slate-800" },
  { id: 5, title: "Immune Response", questions: 10, difficulty: "Easy", color: "bg-slate-700" },
];

export const chapters: Chapter[] = [
  { id: 1, title: "Ch. 1 - Introduction to Microbiology" },
  { id: 2, title: "Ch. 2 - Cell Structure and Function" },
  { id: 3, title: "Ch. 3 - Bacterial Genetics" },
  { id: 4, title: "Ch. 4 - Microbial Metabolism" },
  { id: 5, title: "Ch. 5 - Microbial Growth" },
  { id: 6, title: "Ch. 6 - Viruses and Prions" },
  { id: 7, title: "Ch. 7 - Control of Microbial Growth" },
  { id: 8, title: "Ch. 8 - Antimicrobial Drugs" },
];
