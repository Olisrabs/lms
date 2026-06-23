import { Menu, Search, Bell, MessageSquare, Zap, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import ThemeToggle from '../../ThemeToggle';

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="lg:pl-64 fixed top-0 left-0 right-0 z-30 border-b border-border bg-background/95 backdrop-blur-2xl">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">
        <div className="flex items-center gap-4 flex-1">
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <Menu size={20} />
          </button>
          
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-secondary/30 border border-border rounded-xl w-full max-w-md focus-within:ring-2 focus-within:ring-primary/50 transition-all">
            <Search size={16} className="text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Global Search..." 
              className="bg-transparent border-none outline-none text-sm w-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <Link to="/admin/announcements" className="p-2 rounded-xl glass hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground relative">
            <Bell size={20} />
            <AnimatePresence>
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-background"
              >
                3
              </motion.span>
            </AnimatePresence>
          </Link>

          <div className="relative ml-2">
            <div 
              className="flex items-center gap-2 p-1 pr-2 rounded-xl glass hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer group"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0 group-hover:bg-primary/30 transition-colors">
                A
              </div>
              <ChevronDown size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
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
                      <p className="font-bold">Admin User</p>
                      <p className="text-xs text-muted-foreground">System Admin</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <Link to="/admin/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                        <User size={16} /> Profile
                      </Link>
                      <Link to="/admin/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                        <Settings size={16} /> Settings
                      </Link>
                    </div>
                    <div className="p-2 border-t border-border">
                      <button onClick={() => setDropdownOpen(false)} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium hover:bg-red-500/10 text-red-500 transition-colors">
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
