import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, BookOpen, 
  FileText, CheckSquare, Trophy, UsersRound,
  X, ChevronRight,
  CalendarDays, Award, ClipboardCheck
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { label: 'Dashboard', path: '/student', icon: LayoutDashboard, exact: true },
  { label: 'Classes', path: '/student/classes', icon: BookOpen },
  { label: 'Timetable', path: '/student/timetable', icon: CalendarDays },
  { label: 'Attendance', path: '/student/attendance', icon: ClipboardCheck },
  { label: 'Assignments', path: '/student/assignments', icon: FileText },
  { label: 'Tests & Quizzes', path: '/student/tests', icon: CheckSquare },
  { label: 'Groups', path: '/student/groups', icon: UsersRound },
  { label: 'Capstone Project', path: '/student/capstone', icon: Trophy },
  { label: 'Certificates', path: '/student/certificates', icon: Award },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

export default function StudentSidebar({ isOpen, setIsOpen }: SidebarProps) {
  return (
    <aside
      className={clsx(
        "fixed left-0 top-0 bottom-0 w-64 bg-card/95 border-r border-border/50 backdrop-blur-xl z-50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="h-16 flex items-center justify-between px-5 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2.5">
          <img 
            src="/logo.PNG" 
            alt="Make It Simple" 
            className="h-7 w-auto object-contain" 
            style={{ maxHeight: '48px', width: 'auto', margin: '0 auto' }} 
          />
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            Student
          </span>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-4 space-y-1 custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) => clsx(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative group",
              isActive 
                ? "text-primary-foreground shadow-lg shadow-primary/20" 
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-primary rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <item.icon size={18} className="relative z-10" />
                <span className="relative z-10">{item.label}</span>
                {isActive && (
                  <ChevronRight size={14} className="ml-auto relative z-10 opacity-70" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
      
      {/* Scrollbar styling for sidebar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(150, 150, 150, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: rgba(150, 150, 150, 0.4);
        }
      `}</style>
    </aside>
  );
}
