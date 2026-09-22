import { useState, useEffect } from 'react';
import { 
  Menu, Search, Bell, ChevronDown, User, Settings, LogOut, 
  BookOpen, Calendar, ClipboardCheck, FileText, CheckSquare, 
  FolderKanban, Trophy, TrendingUp, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../../ThemeToggle';
import { useAuth } from '../../../contexts/AuthContext';

interface InstructorTopbarProps {
  onMenuClick: () => void;
  cohorts?: any[];
  selectedCohortId?: string | null;
  onSelectCohort?: (id: string | null) => void;
}

const instructorNavShortcuts = [
  { label: 'Dashboard Overview', path: '/instructor', icon: BookOpen, desc: 'View statistics & recent activity' },
  { label: 'Learning Materials', path: '/instructor/materials', icon: FileText, desc: 'Upload documents and guides' },
  { label: 'Class Schedule', path: '/instructor/schedule', icon: Calendar, desc: 'Schedule and launch live classes' },
  { label: 'Timetable', path: '/instructor/timetable', icon: Calendar, desc: 'Manage weekly cohort timetable' },
  { label: 'Attendance Management', path: '/instructor/attendance', icon: ClipboardCheck, desc: 'Track and mark student attendance' },
  { label: 'Assignment Submissions', path: '/instructor/assignments', icon: FileText, desc: 'Review and grade student work' },
  { label: 'Tests & Quizzes', path: '/instructor/tests', icon: CheckSquare, desc: 'Create and publish tests' },
  { label: 'Student Groups', path: '/instructor/groups', icon: FolderKanban, desc: 'Manage cohort project groups' },
  { label: 'Capstone Projects', path: '/instructor/capstone', icon: Trophy, desc: 'Review capstone submissions' },
  { label: 'Gradebook', path: '/instructor/grades', icon: Trophy, desc: 'Export and monitor grades' },
  { label: 'Student Performance', path: '/instructor/performance', icon: TrendingUp, desc: 'Analyze class averages and at-risk students' },
  { label: 'Announcements', path: '/instructor/announcements', icon: Bell, desc: 'Broadcast notices to students' },
  { label: 'Instructor Profile', path: '/instructor/profile', icon: User, desc: 'Manage personal details' },
  { label: 'Account Settings', path: '/instructor/settings', icon: Settings, desc: 'Security, password & preferences' },
];

export default function InstructorTopbar({
  onMenuClick,
  cohorts = [],
  selectedCohortId = null,
  onSelectCohort = () => {},
}: InstructorTopbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'IN';

  const handleLogout = async () => {
    setDropdownOpen(false);
    await signOut();
    navigate('/staff', { replace: true });
  };

  // Keyboard shortcut Ctrl+K / Cmd+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredShortcuts = instructorNavShortcuts.filter((s) =>
    s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <header className="h-16 fixed top-0 right-0 left-0 lg:left-64 bg-card/90 backdrop-blur-2xl border-b border-border/50 z-30 flex items-center justify-between px-4 sm:px-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)] transition-all">
        {/* Left: Mobile Menu & Search trigger */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-xl transition-colors shrink-0"
            title="Open Sidebar"
            aria-label="Open Sidebar"
          >
            <Menu size={20} />
          </button>

          {/* Quick Search Button / Input */}
          <div
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 bg-secondary/50 hover:bg-secondary/70 border border-border/40 rounded-full w-full max-w-sm cursor-pointer transition-all group"
          >
            <Search size={15} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            <span className="text-sm text-muted-foreground group-hover:text-foreground flex-1 truncate select-none">
              Quick jump or search...
            </span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background/80 text-muted-foreground border border-border/50 shadow-xs">
              ⌘K
            </kbd>
          </div>

          {/* Mobile search icon */}
          <button
            onClick={() => setSearchOpen(true)}
            className="sm:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-xl transition-colors"
            title="Search"
          >
            <Search size={18} />
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Cohort Selector */}
          {cohorts.length > 0 && (
            <div className="hidden md:flex items-center gap-2 bg-secondary/40 border border-border/40 rounded-full pl-3 pr-2 py-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cohort</span>
              <select
                value={selectedCohortId || ''}
                onChange={(e) => onSelectCohort(e.target.value || null)}
                className="bg-transparent text-foreground text-xs font-semibold focus:outline-none cursor-pointer pr-1 border-none"
              >
                {cohorts.map((c: any) => (
                  <option key={c.id} value={c.id} className="bg-card text-foreground">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Announcements / Notifications Link */}
          <Link
            to="/instructor/announcements"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/70 rounded-full transition-colors relative"
            title="Announcements & Notifications"
          >
            <Bell size={19} />
            <span className="absolute top-1 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-card animate-pulse" />
          </Link>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Divider */}
          <div className="h-5 w-px bg-border/60 mx-0.5" />

          {/* User Profile Pill & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-secondary/70 transition-colors group cursor-pointer"
              aria-label="Instructor profile menu"
            >
              <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-primary font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                {initials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold leading-tight group-hover:text-primary transition-colors line-clamp-1">
                  {user?.full_name || 'Instructor'}
                </p>
                <p className="text-[10px] text-muted-foreground">Instructor</p>
              </div>
              <ChevronDown
                size={13}
                className={`text-muted-foreground transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    style={{ backgroundColor: 'var(--card-opaque, #ffffff)' }}
                    className="absolute right-0 mt-2.5 w-60 border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-border bg-secondary/30">
                      <p className="font-bold text-sm text-foreground">{user?.full_name || 'Instructor'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email || 'instructor@academy.edu'}</p>
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-[11px] font-medium text-muted-foreground">Instructor Faculty</span>
                      </div>
                    </div>

                    <div className="p-2 space-y-1">
                      <Link
                        to="/instructor/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium hover:bg-secondary/70 transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <User size={15} /> My Profile
                      </Link>
                      <Link
                        to="/instructor/settings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium hover:bg-secondary/70 transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Settings size={15} /> Account Settings
                      </Link>
                    </div>

                    <div className="p-2 border-t border-border">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-red-500/10 text-red-500 transition-colors text-left"
                      >
                        <LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Global Quick Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              style={{ backgroundColor: 'var(--card-opaque, #ffffff)' }}
              className="border border-border rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <div className="flex items-center px-4 py-3.5 border-b border-border gap-3">
                <Search size={18} className="text-muted-foreground" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Jump to section, tool, or feature..."
                  className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder:text-muted-foreground"
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto p-2 space-y-1 divide-y divide-border/30">
                {filteredShortcuts.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-xs">
                    No matching instructor pages found.
                  </div>
                ) : (
                  filteredShortcuts.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => {
                        setSearchOpen(false);
                        navigate(item.path);
                      }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/70 transition-colors text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <item.icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                          {item.label}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">{item.desc}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-secondary/30 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground px-4">
                <span>Navigate with click or type to filter</span>
                <span className="font-mono text-[10px]">ESC to close</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
