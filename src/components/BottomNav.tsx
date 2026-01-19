import { Home, BookOpen, Video, User } from "lucide-react";
import { motion } from "framer-motion";
import { buttonTap, springTransition } from "@/lib/motionVariants";
import { useHaptics } from "@/hooks/useHaptics";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "home", icon: Home, label: "Home" },
  { id: "library", icon: BookOpen, label: "Textbooks" },
  { id: "study", icon: Video, label: "Study Prep" },
  { id: "account", icon: User, label: "Account" },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { mediumTap } = useHaptics();

  const handleTabChange = (tab: string) => {
    mediumTap();
    onTabChange(tab);
  };

  return (
    <nav className="bg-card border-t border-border px-2 pt-2 pb-safe sticky bottom-0 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center">
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => handleTabChange(item.id)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${
              activeTab === item.id
                ? "text-primary"
                : "text-muted-foreground"
            }`}
            whileTap={buttonTap}
            transition={springTransition}
          >
            <motion.div
              animate={activeTab === item.id ? { scale: [1, 1.15, 1] } : {}}
              transition={springTransition}
            >
              <item.icon className="w-6 h-6" fill={activeTab === item.id ? "currentColor" : "none"} />
            </motion.div>
            <span className="text-xs font-medium">{item.label}</span>
          </motion.button>
        ))}
      </div>
    </nav>
  );
}
