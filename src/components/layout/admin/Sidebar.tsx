import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, BookOpen, Users, UserSquare2, 
  GraduationCap, Calendar, FileText, CheckSquare, 
  Trophy, UsersRound, Clock, LineChart, 
  Megaphone, PieChart, Settings, X, ChevronRight
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Programs', path: '/admin/programs', icon: BookOpen },
  { label: 'Cohorts', path: '/admin/cohorts', icon: Users },
  { label: 'Courses', path: '/admin/courses', icon: GraduationCap },
  { label: 'Students', path: '/admin/students', icon: UserSquare2 },
  { label: 'Instructors', path: '/admin/instructors', icon: UserSquare2 },
  { label: 'Class Schedule', path: '/admin/schedule', icon: Calendar },
  { label: 'Assignments', path: '/admin/assignments', icon: FileText },
  { label: 'Tests', path: '/admin/tests', icon: CheckSquare },
  { label: 'Capstone Projects', path: '/admin/capstone', icon: Trophy },
  { label: 'Groups', path: '/admin/groups', icon: UsersRound },
  { label: 'Attendance', path: '/admin/attendance', icon: Clock },
  { label: 'Grades', path: '/admin/grades', icon: LineChart },
  { label: 'Announcements', path: '/admin/announcements', icon: Megaphone },
  { label: 'Reports', path: '/admin/reports', icon: PieChart },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
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
            <BookOpen size={18} />
          </div>
          Academy
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-4 space-y-1 hide-scrollbar">
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

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </aside>
  );
}
