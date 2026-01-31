import { forwardRef } from 'react';
import { Home, BookOpen, Video, User } from "lucide-react";
import { motion } from "framer-motion";
import { buttonTap, springTransition } from "@/lib/motionVariants";
import { useHaptics } from "@/hooks/useHaptics";
import { toast } from "sonner";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "home", icon: Home, label: "Home", active: true },
  { id: "library", icon: BookOpen, label: "Textbooks", active: false },
  { id: "study", icon: Video, label: "Study Prep", active: false },
  { id: "account", icon: User, label: "Account", active: false },
];

export const BottomNav = forwardRef<HTMLElement, BottomNavProps>(
  ({ activeTab, onTabChange }, ref) => {
    const { mediumTap } = useHaptics();

    const handleTabChange = (tab: string) => {
      mediumTap();
      const navItem = navItems.find(item => item.id === tab);
      
      if (navItem && !navItem.active) {
        toast("Coming Soon", {
          description: `The ${navItem.label} section is under development.`,
          duration: 2000
        });
        return;
      }
      
      onTabChange(tab);
    };

    return (
      <nav ref={ref} className="bg-card border-t border-border px-2 pt-1.5 pb-safe sticky bottom-0 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg ${
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
);

BottomNav.displayName = 'BottomNav';
