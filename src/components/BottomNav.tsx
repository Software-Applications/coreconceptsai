import { Home, BookOpen, Video, Briefcase, User } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "home", icon: Home, label: "Home" },
  { id: "library", icon: BookOpen, label: "Library" },
  { id: "study", icon: Video, label: "Study" },
  { id: "jobs", icon: Briefcase, label: "Job Skills" },
  { id: "account", icon: User, label: "Account" },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="bg-card border-t border-border px-2 pt-2 pb-safe sticky bottom-0">
      <div className="flex justify-around items-center">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors active:scale-95 ${
              activeTab === item.id
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <item.icon className="w-6 h-6" fill={activeTab === item.id ? "currentColor" : "none"} />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
