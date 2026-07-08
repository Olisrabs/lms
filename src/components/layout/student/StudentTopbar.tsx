import { Menu, Search, Bell, ChevronDown, User, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../../ThemeToggle';

interface TopbarProps {
  onMenuClick: () => void;
}

export default function StudentTopbar({ onMenuClick }: TopbarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="h-16 fixed top-0 right-0 left-0 lg:left-64 bg-background/60 backdrop-blur-xl border-b border-border z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
        
        <div className="max-w-md w-full hidden sm:block relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Search courses, resources, or peers..." 
            className="w-full bg-secondary/50 border border-border rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">

        <Link 
          to="/student/announcements"
          className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors block"
        >
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-background"></span>
        </Link>
        
        <ThemeToggle />

        <div className="relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-secondary transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent border-2 border-background shadow-md flex items-center justify-center text-white text-sm font-bold overflow-hidden">
              JD
            </div>
            <ChevronDown size={16} className="text-muted-foreground" />
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowProfileMenu(false)}
                />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-48 glass-card rounded-2xl shadow-xl border border-border z-50 overflow-hidden flex flex-col py-2"
                >
                  <Link 
                    to="/student/profile" 
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-secondary transition-colors text-sm"
                  >
                    <User size={16} /> Profile
                  </Link>
                  <Link 
                    to="/student/settings" 
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-secondary transition-colors text-sm"
                  >
                    <SettingsIcon size={16} /> Settings
                  </Link>
                  <div className="h-px bg-border my-1" />
                  <button className="flex items-center gap-2 px-4 py-2 hover:bg-red-500/10 text-red-500 transition-colors text-sm w-full text-left">
                    <LogOut size={16} /> Logout
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
