export interface Subject {
  id: number;
  name: string;
  color: string;
  imageUrl: string;
  textbook: {
    title: string;
    imageUrl: string;
  };
}

export interface VideoTile {
  id: number;
  subjectId: number;
  title: string;
  author: string;
  duration: string;
  gradient: string;
  thumbnail: string;
  avatarUrl: string;
  textbookPages?: string;
  textbookChapter?: string;
}

export interface PracticeTile {
  id: number;
  subjectId: number;
  title: string;
  questions: number;
  difficulty: string;
  color: string;
  imageUrl: string;
  textbookPages?: string;
  textbookChapter?: string;
}

export interface Chapter {
  id: number;
  subjectId: number;
  title: string;
}

export const subjects: Subject[] = [
  { 
    id: 1, 
    name: "Microbiology", 
    color: "bg-navy-800", 
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=100&h=100&fit=crop",
    textbook: {
      title: "Microbiology with Diseases by Body System, 5th edition",
      imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=200&h=250&fit=crop"
    }
  },
  { 
    id: 2, 
    name: "Chemistry", 
    color: "bg-navy-700", 
    imageUrl: "https://images.unsplash.com/photo-1532634922-8fe0b757fb13?w=100&h=100&fit=crop",
    textbook: {
      title: "Chemistry: The Central Science, 15th edition",
      imageUrl: "https://images.unsplash.com/photo-1532634922-8fe0b757fb13?w=200&h=250&fit=crop"
    }
  },
  { 
    id: 3, 
    name: "Biology", 
    color: "bg-navy-800", 
    imageUrl: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=100&h=100&fit=crop",
    textbook: {
      title: "Campbell Biology, 12th edition",
      imageUrl: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=200&h=250&fit=crop"
    }
  },
];

// Microbiology Videos
export const videoTiles: VideoTile[] = [
  // Microbiology (subjectId: 1)
  { 
    id: 1, 
    subjectId: 1,
    title: "Introduction to Microbiology", 
    author: "Jason Amores", 
    duration: "12:34", 
    gradient: "from-navy-800 to-navy-700",
    thumbnail: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&h=300&fit=crop",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    textbookPages: "pp. 1-28",
    textbookChapter: "Chapter 1"
  },
  { 
    id: 2, 
    subjectId: 1,
    title: "Gram Staining Techniques", 
    author: "Dr. Emily Park", 
    duration: "08:22", 
    gradient: "from-navy-700 to-navy-600",
    thumbnail: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400&h=300&fit=crop",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    textbookPages: "pp. 45-62",
    textbookChapter: "Chapter 2"
  },
  { 
    id: 3, 
    subjectId: 1,
    title: "Antibiotic Resistance", 
    author: "Dr. Lisa Wong", 
    duration: "15:47", 
    gradient: "from-navy-800 to-navy-700",
    thumbnail: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400&h=300&fit=crop",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    textbookPages: "pp. 180-205",
    textbookChapter: "Chapter 8"
  },
  { 
    id: 4, 
    subjectId: 1,
    title: "Immune System Response", 
    author: "Dr. Rachel Kim", 
    duration: "11:05", 
    gradient: "from-navy-700 to-navy-600",
    thumbnail: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400&h=300&fit=crop",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    textbookPages: "pp. 320-355",
    textbookChapter: "Chapter 14"
  },
  { 
    id: 5, 
    subjectId: 1,
    title: "Bacterial Growth Phases", 
    author: "Dr. Mike Chen", 
    duration: "09:18", 
    gradient: "from-navy-800 to-navy-700",
    thumbnail: "https://images.unsplash.com/photo-1579165466741-7f35e4755660?w=400&h=300&fit=crop",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    textbookPages: "pp. 95-118",
    textbookChapter: "Chapter 5"
  },
  // Chemistry (subjectId: 2)
  { 
    id: 6, 
    subjectId: 2,
    title: "Atomic Structure Basics", 
    author: "Dr. Sarah Chen", 
    duration: "14:22", 
    gradient: "from-navy-800 to-navy-700",
    thumbnail: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=400&h=300&fit=crop",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face",
    textbookPages: "pp. 35-68",
    textbookChapter: "Chapter 2"
  },
  { 
    id: 7, 
    subjectId: 2,
    title: "Chemical Bonding", 
    author: "Prof. James Miller", 
    duration: "18:45", 
    gradient: "from-navy-700 to-navy-600",
    thumbnail: "https://images.unsplash.com/photo-1532634922-8fe0b757fb13?w=400&h=300&fit=crop",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face",
    textbookPages: "pp. 145-182",
    textbookChapter: "Chapter 8"
  },
  { 
    id: 8, 
    subjectId: 2,
    title: "Organic Chemistry Fundamentals", 
    author: "Dr. Amanda Torres", 
    duration: "21:10", 
    gradient: "from-navy-800 to-navy-700",
    thumbnail: "https://images.unsplash.com/photo-1616400619175-5beda3a17896?w=400&h=300&fit=crop",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face",
    textbookPages: "pp. 420-465",
    textbookChapter: "Chapter 24"
  },
  { 
    id: 9, 
    subjectId: 2,
    title: "Stoichiometry Explained", 
    author: "Dr. Kevin Park", 
    duration: "16:33", 
    gradient: "from-navy-700 to-navy-600",
    thumbnail: "https://images.unsplash.com/photo-1554475901-4538ddfbccc2?w=400&h=300&fit=crop",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face",
    textbookPages: "pp. 75-110",
    textbookChapter: "Chapter 3"
  },
  // Biology (subjectId: 3)
  { 
    id: 10, 
    subjectId: 3,
    title: "Cell Division & Mitosis", 
    author: "Dr. Maria Santos", 
    duration: "19:28", 
    gradient: "from-navy-800 to-navy-700",
    thumbnail: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400&h=300&fit=crop",
    avatarUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop&crop=face",
    textbookPages: "pp. 245-268",
    textbookChapter: "Chapter 9"
  },
  { 
    id: 11, 
    subjectId: 3,
    title: "DNA Replication Process", 
    author: "Prof. Robert Lee", 
    duration: "22:15", 
    gradient: "from-navy-700 to-navy-600",
    thumbnail: "https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=400&h=300&fit=crop",
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face",
    textbookPages: "pp. 312-340",
    textbookChapter: "Chapter 16"
  },
  { 
    id: 12, 
    subjectId: 3,
    title: "Photosynthesis Deep Dive", 
    author: "Dr. Jennifer Wu", 
    duration: "17:42", 
    gradient: "from-navy-800 to-navy-700",
    thumbnail: "https://images.unsplash.com/photo-1446071103084-c257b5f70672?w=400&h=300&fit=crop",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
    textbookPages: "pp. 185-210",
    textbookChapter: "Chapter 8"
  },
  { 
    id: 13, 
    subjectId: 3,
    title: "Evolution & Natural Selection", 
    author: "Dr. David Brown", 
    duration: "24:05", 
    gradient: "from-navy-700 to-navy-600",
    thumbnail: "https://images.unsplash.com/photo-1516934024742-b461fba47600?w=400&h=300&fit=crop",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    textbookPages: "pp. 480-520",
    textbookChapter: "Chapter 22-23"
  },
  { 
    id: 14, 
    subjectId: 3,
    title: "Human Anatomy Overview", 
    author: "Dr. Lisa Thompson", 
    duration: "20:30", 
    gradient: "from-navy-800 to-navy-700",
    thumbnail: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop",
    avatarUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=100&h=100&fit=crop&crop=face",
    textbookPages: "pp. 850-895",
    textbookChapter: "Chapter 40-42"
  },
];

export const practiceTiles: PracticeTile[] = [
  // Microbiology (subjectId: 1)
  { id: 1, subjectId: 1, title: "Cell Structure Quiz", questions: 15, difficulty: "Easy", color: "bg-navy-800", imageUrl: "https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=400&h=300&fit=crop", textbookPages: "pp. 29-55", textbookChapter: "Chapter 2" },
  { id: 2, subjectId: 1, title: "Bacterial Identification", questions: 20, difficulty: "Medium", color: "bg-navy-900", imageUrl: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&h=300&fit=crop", textbookPages: "pp. 56-85", textbookChapter: "Chapter 3" },
  { id: 3, subjectId: 1, title: "Virology Concepts", questions: 12, difficulty: "Hard", color: "bg-navy-800", imageUrl: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=400&h=300&fit=crop", textbookPages: "pp. 120-150", textbookChapter: "Chapter 6" },
  { id: 4, subjectId: 1, title: "Antibiotic Mechanisms", questions: 18, difficulty: "Medium", color: "bg-navy-900", imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=300&fit=crop", textbookPages: "pp. 180-205", textbookChapter: "Chapter 8" },
  { id: 5, subjectId: 1, title: "Immune Response", questions: 10, difficulty: "Easy", color: "bg-navy-800", imageUrl: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400&h=300&fit=crop", textbookPages: "pp. 320-355", textbookChapter: "Chapter 14" },
  // Chemistry (subjectId: 2)
  { id: 6, subjectId: 2, title: "Periodic Table Quiz", questions: 25, difficulty: "Easy", color: "bg-navy-800", imageUrl: "https://images.unsplash.com/photo-1532634922-8fe0b757fb13?w=400&h=300&fit=crop", textbookPages: "pp. 35-68", textbookChapter: "Chapter 2" },
  { id: 7, subjectId: 2, title: "Balancing Equations", questions: 20, difficulty: "Medium", color: "bg-navy-900", imageUrl: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=400&h=300&fit=crop", textbookPages: "pp. 75-110", textbookChapter: "Chapter 3" },
  { id: 8, subjectId: 2, title: "Organic Compounds", questions: 18, difficulty: "Hard", color: "bg-navy-800", imageUrl: "https://images.unsplash.com/photo-1616400619175-5beda3a17896?w=400&h=300&fit=crop", textbookPages: "pp. 420-465", textbookChapter: "Chapter 24" },
  { id: 9, subjectId: 2, title: "Acid-Base Reactions", questions: 15, difficulty: "Medium", color: "bg-navy-900", imageUrl: "https://images.unsplash.com/photo-1554475901-4538ddfbccc2?w=400&h=300&fit=crop", textbookPages: "pp. 260-295", textbookChapter: "Chapter 16" },
  // Biology (subjectId: 3)
  { id: 10, subjectId: 3, title: "Cell Biology Basics", questions: 20, difficulty: "Easy", color: "bg-navy-800", imageUrl: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400&h=300&fit=crop", textbookPages: "pp. 95-142", textbookChapter: "Chapter 4-5" },
  { id: 11, subjectId: 3, title: "Genetics & Heredity", questions: 22, difficulty: "Medium", color: "bg-navy-900", imageUrl: "https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=400&h=300&fit=crop", textbookPages: "pp. 270-320", textbookChapter: "Chapter 14-15" },
  { id: 12, subjectId: 3, title: "Ecosystem Dynamics", questions: 15, difficulty: "Medium", color: "bg-navy-800", imageUrl: "https://images.unsplash.com/photo-1446071103084-c257b5f70672?w=400&h=300&fit=crop", textbookPages: "pp. 1150-1195", textbookChapter: "Chapter 52-54" },
  { id: 13, subjectId: 3, title: "Human Body Systems", questions: 30, difficulty: "Hard", color: "bg-navy-900", imageUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop", textbookPages: "pp. 850-920", textbookChapter: "Chapter 40-43" },
];

export const chapters: Chapter[] = [
  // Microbiology (subjectId: 1)
  { id: 1, subjectId: 1, title: "Ch. 1 - Introduction to Microbiology" },
  { id: 2, subjectId: 1, title: "Ch. 2 - Cell Structure and Function" },
  { id: 3, subjectId: 1, title: "Ch. 3 - Bacterial Genetics" },
  { id: 4, subjectId: 1, title: "Ch. 4 - Microbial Metabolism" },
  { id: 5, subjectId: 1, title: "Ch. 5 - Microbial Growth" },
  { id: 6, subjectId: 1, title: "Ch. 6 - Viruses and Prions" },
  { id: 7, subjectId: 1, title: "Ch. 7 - Control of Microbial Growth" },
  { id: 8, subjectId: 1, title: "Ch. 8 - Antimicrobial Drugs" },
  // Chemistry (subjectId: 2)
  { id: 9, subjectId: 2, title: "Ch. 1 - Matter and Measurements" },
  { id: 10, subjectId: 2, title: "Ch. 2 - Atoms, Molecules, and Ions" },
  { id: 11, subjectId: 2, title: "Ch. 3 - Stoichiometry" },
  { id: 12, subjectId: 2, title: "Ch. 4 - Reactions in Aqueous Solution" },
  { id: 13, subjectId: 2, title: "Ch. 5 - Thermochemistry" },
  { id: 14, subjectId: 2, title: "Ch. 6 - Electronic Structure of Atoms" },
  { id: 15, subjectId: 2, title: "Ch. 7 - Periodic Properties" },
  // Biology (subjectId: 3)
  { id: 16, subjectId: 3, title: "Ch. 1 - The Study of Life" },
  { id: 17, subjectId: 3, title: "Ch. 2 - The Chemical Foundation of Life" },
  { id: 18, subjectId: 3, title: "Ch. 3 - Biological Macromolecules" },
  { id: 19, subjectId: 3, title: "Ch. 4 - Cell Structure" },
  { id: 20, subjectId: 3, title: "Ch. 5 - Cell Membranes" },
  { id: 21, subjectId: 3, title: "Ch. 6 - Metabolism" },
  { id: 22, subjectId: 3, title: "Ch. 7 - Cellular Respiration" },
  { id: 23, subjectId: 3, title: "Ch. 8 - Photosynthesis" },
];
