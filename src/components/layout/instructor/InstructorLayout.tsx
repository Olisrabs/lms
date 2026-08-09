import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import InstructorSidebar from './InstructorSidebar';
import ThemeToggle from '../../ThemeToggle';
import { useAuth } from '../../../contexts/AuthContext';

export default function InstructorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const initials = user?.full_name ? user.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'IN';

  const handleLogout = async () => {
    setDropdownOpen(false);
    await signOut();
    navigate('/staff', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex text-foreground selection:bg-primary/30">
      <InstructorSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0 transition-all duration-300 ease-in-out">
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between transition-colors duration-300">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-xl transition-colors"
            >
              <Menu size={20} />
            </button>

            <div className="hidden sm:flex items-center relative max-w-md w-full">
              <Search className="absolute left-3 text-muted-foreground" size={18} />
              <input 
                type="text" 
                placeholder="Global Search..." 
                className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">

            <ThemeToggle />
            
            <div className="flex items-center gap-1 sm:gap-2 border-r border-border pr-2 sm:pr-4">
              <Link to="/instructor/announcements" className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-xl transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-card"></span>
              </Link>
            </div>
            <div className="relative">
              <div 
                className="flex items-center gap-3 pl-2 cursor-pointer group"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xs ring-2 ring-transparent group-hover:ring-primary/30 transition-all">
                    {initials}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-bold leading-tight group-hover:text-primary transition-colors">{user?.full_name || 'Instructor'}</p>
                    <p className="text-xs text-muted-foreground">Instructor</p>
                  </div>
                <ChevronDown size={14} className="text-muted-foreground hidden sm:block group-hover:text-primary transition-colors" />
              </div>

              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)}></div>
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-3 w-56 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-border bg-secondary/30">
                        <p className="font-bold">{user?.full_name || 'Instructor'}</p>
                        <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
                      </div>
                      <div className="p-2 space-y-1">
                        <Link to="/instructor/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                          <User size={16} /> Profile
                        </Link>
                        <Link to="/instructor/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                          <Settings size={16} /> Settings
                        </Link>
                      </div>
                      <div className="p-2 border-t border-border">
                        <button 
                          onClick={handleLogout} 
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium hover:bg-red-500/10 text-red-500 transition-colors"
                        >
                          <LogOut size={16} /> Logout
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
