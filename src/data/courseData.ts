export interface Subject {
  id: number;
  name: string;
  color: string;
}

export interface VideoTile {
  id: number;
  subjectId: number;
  title: string;
  author: string;
  duration: string;
  gradient: string;
}

export interface PracticeTile {
  id: number;
  subjectId: number;
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
  { id: 1, name: "Microbiology", color: "bg-purple-600" },
  { id: 2, name: "Chemistry", color: "bg-blue-500" },
  { id: 3, name: "Biology", color: "bg-green-500" },
];

export const videoTiles: VideoTile[] = [
  // Microbiology (subjectId: 1)
  { id: 1, subjectId: 1, title: "Introduction to Microbiology", author: "Jason Amores", duration: "12:34", gradient: "from-purple-400 to-pink-300" },
  { id: 2, subjectId: 1, title: "Gram Staining Techniques", author: "Dr. Emily Park", duration: "08:22", gradient: "from-purple-500 to-violet-300" },
  { id: 3, subjectId: 1, title: "Bacterial Growth Phases", author: "Dr. Mike Chen", duration: "09:18", gradient: "from-indigo-400 to-purple-300" },
  // Chemistry (subjectId: 2)
  { id: 4, subjectId: 2, title: "Chemical Bonding Basics", author: "Dr. Sarah Lee", duration: "14:22", gradient: "from-blue-400 to-cyan-300" },
  { id: 5, subjectId: 2, title: "Organic Chemistry Intro", author: "Dr. James Wilson", duration: "11:45", gradient: "from-sky-400 to-blue-300" },
  { id: 6, subjectId: 2, title: "Acid-Base Reactions", author: "Dr. Maria Garcia", duration: "10:30", gradient: "from-cyan-400 to-teal-300" },
  // Biology (subjectId: 3)
  { id: 7, subjectId: 3, title: "Cell Structure Overview", author: "Dr. Lisa Wong", duration: "15:47", gradient: "from-green-400 to-teal-300" },
  { id: 8, subjectId: 3, title: "Immune System Response", author: "Dr. Rachel Kim", duration: "11:05", gradient: "from-emerald-400 to-green-300" },
  { id: 9, subjectId: 3, title: "DNA Replication", author: "Dr. Tom Brown", duration: "13:20", gradient: "from-lime-400 to-emerald-300" },
];

export const practiceTiles: PracticeTile[] = [
  // Microbiology (subjectId: 1)
  { id: 1, subjectId: 1, title: "Bacterial Identification", questions: 20, difficulty: "Medium", color: "bg-purple-500" },
  { id: 2, subjectId: 1, title: "Virology Concepts", questions: 12, difficulty: "Hard", color: "bg-violet-500" },
  { id: 3, subjectId: 1, title: "Microbial Growth", questions: 15, difficulty: "Easy", color: "bg-indigo-500" },
  // Chemistry (subjectId: 2)
  { id: 4, subjectId: 2, title: "Chemical Equations", questions: 18, difficulty: "Medium", color: "bg-blue-500" },
  { id: 5, subjectId: 2, title: "Periodic Table Quiz", questions: 25, difficulty: "Easy", color: "bg-cyan-500" },
  { id: 6, subjectId: 2, title: "Organic Reactions", questions: 15, difficulty: "Hard", color: "bg-sky-500" },
  // Biology (subjectId: 3)
  { id: 7, subjectId: 3, title: "Cell Structure Quiz", questions: 15, difficulty: "Easy", color: "bg-emerald-500" },
  { id: 8, subjectId: 3, title: "Genetics Fundamentals", questions: 20, difficulty: "Medium", color: "bg-green-500" },
  { id: 9, subjectId: 3, title: "Immune Response", questions: 10, difficulty: "Easy", color: "bg-teal-500" },
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
