import { useState } from "react";
import { Plus, Play, Home, BookOpen, Video, Briefcase, User, List } from "lucide-react";

const subjects = [
  { id: 1, name: "Microbiology", color: "bg-purple-600" },
  { id: 2, name: "Chemistry", color: "bg-blue-500" },
  { id: 3, name: "Biology", color: "bg-green-500" },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="px-4 pt-4 pb-2">
        <div className="flex justify-end">
          <button className="text-primary font-medium">Sign in</button>
        </div>
        <h1 className="text-3xl font-bold text-foreground mt-2">Home</h1>
        <div className="w-16 h-1 bg-primary mt-2 rounded-full" />
      </header>

      {/* Subject Chips */}
      <section className="px-4 py-4">
        <div className="flex gap-3 overflow-x-auto pb-2">
          <button className="flex-shrink-0 w-12 h-12 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
            <Plus className="w-6 h-6 text-muted-foreground" />
          </button>
          {subjects.map((subject) => (
            <button
              key={subject.id}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-accent transition-colors"
            >
              <div className={`w-8 h-8 ${subject.color} rounded-lg flex items-center justify-center`}>
                <span className="text-white text-xs font-bold">
                  {subject.name.charAt(0)}
                </span>
              </div>
              <span className="font-medium text-foreground">{subject.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Your eTextbook */}
      <section className="px-4 py-2">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-foreground">Your eTextbook</h2>
          <button className="text-primary font-medium text-sm">Go to library</button>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
          <div className="w-16 h-20 bg-purple-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold text-center px-1">MICRO<br/>BIOLOGY</span>
          </div>
          <div>
            <p className="font-medium text-foreground">Microbiology with Diseases by Body System, 5th edition</p>
          </div>
        </div>
      </section>

      {/* Start Studying */}
      <section className="px-4 py-4 flex-1">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-foreground">Start studying</h2>
          <button className="text-primary font-medium text-sm">Go to topic</button>
        </div>
        
        {/* Chapter Selector */}
        <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between mb-4">
          <span className="font-medium text-foreground">Ch. 1 - Introduction to Microbiology</span>
          <List className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Video Cards */}
        <div className="flex gap-3 overflow-x-auto pb-4">
          {/* Main Video Card */}
          <div className="flex-shrink-0 w-72">
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-purple-400 to-pink-300 aspect-video">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                  <Play className="w-8 h-8 text-foreground ml-1" fill="currentColor" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                00:00
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-8 h-8 bg-amber-600 rounded-full" />
              <div>
                <p className="font-medium text-foreground text-sm">Introduction to Microbiology Channel</p>
                <p className="text-muted-foreground text-xs">By Jason Amores</p>
              </div>
            </div>
          </div>

          {/* Secondary Card */}
          <div className="flex-shrink-0 w-48">
            <div className="rounded-xl overflow-hidden bg-card border border-border aspect-video p-2">
              <div className="text-xs">
                <p className="font-bold text-primary mb-1">CONCEPT: INTRODUCTION</p>
                <p className="text-muted-foreground text-[10px]">• Microbiology: the study...</p>
                <p className="text-muted-foreground text-[10px]">• Prefix "..."</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-8 h-8 bg-amber-600 rounded-full" />
              <div>
                <p className="font-medium text-foreground text-sm truncate">Intro...</p>
                <p className="text-muted-foreground text-xs">By J...</p>
              </div>
            </div>
          </div>
        </div>

        {/* Get Exam Ready */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-foreground">Get exam ready</h2>
          <button className="text-primary font-medium text-sm">Go to practice</button>
        </div>
      </section>

      {/* Bottom Navigation */}
      <nav className="bg-card border-t border-border px-2 py-2 sticky bottom-0">
        <div className="flex justify-around items-center">
          {[
            { id: "home", icon: Home, label: "Home" },
            { id: "library", icon: BookOpen, label: "Library" },
            { id: "study", icon: Video, label: "Study" },
            { id: "jobs", icon: Briefcase, label: "Job Skills" },
            { id: "account", icon: User, label: "Account" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                activeTab === item.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="w-6 h-6" fill={activeTab === item.id ? "currentColor" : "none"} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
        {/* Home Indicator */}
        <div className="flex justify-center mt-2">
          <div className="w-32 h-1 bg-foreground rounded-full" />
        </div>
      </nav>
    </div>
  );
};

export default Index;
