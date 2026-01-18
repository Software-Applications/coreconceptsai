export interface Subject {
  id: number;
  name: string;
  color: string;
  imageUrl: string;
}

export interface VideoTile {
  id: number;
  title: string;
  author: string;
  duration: string;
  gradient: string;
  thumbnail: string;
  avatarUrl: string;
}

export interface PracticeTile {
  id: number;
  title: string;
  questions: number;
  difficulty: string;
  color: string;
  imageUrl: string;
}

export interface Chapter {
  id: number;
  title: string;
}

export const subjects: Subject[] = [
  { id: 1, name: "Microbiology", color: "bg-navy-800", imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=100&h=100&fit=crop" },
  { id: 2, name: "Chemistry", color: "bg-navy-700", imageUrl: "https://images.unsplash.com/photo-1532634922-8fe0b757fb13?w=100&h=100&fit=crop" },
  { id: 3, name: "Biology", color: "bg-navy-800", imageUrl: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=100&h=100&fit=crop" },
];

export const videoTiles: VideoTile[] = [
  { 
    id: 1, 
    title: "Introduction to Microbiology", 
    author: "Jason Amores", 
    duration: "12:34", 
    gradient: "from-navy-800 to-navy-700",
    thumbnail: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&h=300&fit=crop",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
  },
  { 
    id: 2, 
    title: "Gram Staining Techniques", 
    author: "Dr. Emily Park", 
    duration: "08:22", 
    gradient: "from-navy-700 to-navy-600",
    thumbnail: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400&h=300&fit=crop",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
  },
  { 
    id: 3, 
    title: "Antibiotic Resistance", 
    author: "Dr. Lisa Wong", 
    duration: "15:47", 
    gradient: "from-navy-800 to-navy-700",
    thumbnail: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400&h=300&fit=crop",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
  },
  { 
    id: 4, 
    title: "Immune System Response", 
    author: "Dr. Rachel Kim", 
    duration: "11:05", 
    gradient: "from-navy-700 to-navy-600",
    thumbnail: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400&h=300&fit=crop",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
  },
  { 
    id: 5, 
    title: "Bacterial Growth Phases", 
    author: "Dr. Mike Chen", 
    duration: "09:18", 
    gradient: "from-navy-800 to-navy-700",
    thumbnail: "https://images.unsplash.com/photo-1579165466741-7f35e4755660?w=400&h=300&fit=crop",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face"
  },
];

export const practiceTiles: PracticeTile[] = [
  { id: 1, title: "Cell Structure Quiz", questions: 15, difficulty: "Easy", color: "bg-navy-800", imageUrl: "https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=400&h=300&fit=crop" },
  { id: 2, title: "Bacterial Identification", questions: 20, difficulty: "Medium", color: "bg-navy-900", imageUrl: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&h=300&fit=crop" },
  { id: 3, title: "Virology Concepts", questions: 12, difficulty: "Hard", color: "bg-navy-800", imageUrl: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=400&h=300&fit=crop" },
  { id: 4, title: "Antibiotic Mechanisms", questions: 18, difficulty: "Medium", color: "bg-navy-900", imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=300&fit=crop" },
  { id: 5, title: "Immune Response", questions: 10, difficulty: "Easy", color: "bg-navy-800", imageUrl: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400&h=300&fit=crop" },
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
