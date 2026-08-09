import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, GraduationCap, 
  FileText, CalendarDays, CheckSquare, Trophy, 
  TrendingUp, Calendar,
  X, ChevronRight, ClipboardCheck, FolderKanban
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { label: 'Dashboard', path: '/instructor', icon: LayoutDashboard, exact: true },
  { label: 'Learning Materials', path: '/instructor/materials', icon: FileText },
  { label: 'Class Schedule', path: '/instructor/schedule', icon: Calendar },
  { label: 'Timetable', path: '/instructor/timetable', icon: CalendarDays },
  { label: 'Attendance', path: '/instructor/attendance', icon: ClipboardCheck },
  { label: 'Assignments', path: '/instructor/assignments', icon: FileText },
  { label: 'Tests & Quizzes', path: '/instructor/tests', icon: CheckSquare },
  { label: 'Groups', path: '/instructor/groups', icon: FolderKanban },
  { label: 'Capstone Projects', path: '/instructor/capstone', icon: Trophy },
  { label: 'Grades', path: '/instructor/grades', icon: Trophy },
  { label: 'Student Performance', path: '/instructor/performance', icon: TrendingUp },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

export default function InstructorSidebar({ isOpen, setIsOpen }: SidebarProps) {
  return (
    <aside
      className={clsx(
        "fixed left-0 top-0 bottom-0 w-64 bg-card/50 border-r border-border backdrop-blur-xl z-50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="h-16 flex items-center justify-between px-6 border-b border-border shrink-0">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
            <GraduationCap size={18} />
          </div>
          Instructor Hub
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
                    layoutId="instructor-sidebar-active"
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
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(150, 150, 150, 0.2); border-radius: 4px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(150, 150, 150, 0.4); }
      `}</style>
    </aside>
  );
}
