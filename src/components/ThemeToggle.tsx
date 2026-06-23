import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setIsDark(!isDark);
  };

  return (
    <button 
      onClick={toggleTheme}
      className="p-2 rounded-xl glass hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
      aria-label="Toggle Theme"
    >
      <motion.div animate={{ rotate: isDark ? 0 : 180 }} transition={{ duration: 0.3 }}>
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </motion.div>
    </button>
  );
}
