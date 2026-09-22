import { motion } from 'framer-motion';
import { User, Mail, Github, Linkedin, Briefcase, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentProfilePage() {
  const { user } = useAuth();

  const fullName = user?.full_name || 'Enrolled Student';
  const email = user?.email || 'student@academy.edu';
  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="glass-card rounded-3xl p-8 border border-border relative overflow-hidden bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          <div className="w-32 h-32 rounded-full border-4 border-background shadow-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white text-4xl font-bold shrink-0">
            {initials}
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-bold mb-2">{fullName}</h1>
            <p className="text-primary font-medium mb-4">Fullstack Engineering Student</p>
            <p className="text-muted-foreground text-sm max-w-2xl mb-6 leading-relaxed">
              Enrolled in Make It Simple Academy. Mastering modern frontend and backend development with hands-on labs, real-world capstone projects, and live faculty mentorship.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <span className="px-3 py-1 bg-secondary rounded-full text-xs font-medium border border-border flex items-center gap-2">
                <Github size={14} /> GitHub Connected
              </span>
              <span className="px-3 py-1 bg-secondary rounded-full text-xs font-medium border border-border flex items-center gap-2">
                <Linkedin size={14} /> LinkedIn Profile
              </span>
              <span className="px-3 py-1 bg-secondary rounded-full text-xs font-medium border border-border flex items-center gap-2">
                <Briefcase size={14} /> Student Portfolio
              </span>
            </div>
          </div>
          <Link
            to="/student/settings"
            className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm shrink-0 hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95"
          >
            <Settings size={16} /> Edit Profile
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <User size={20} /> Personal Information
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Full Name</p>
              <p className="font-semibold text-foreground">{fullName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Email Address</p>
              <p className="font-semibold flex items-center gap-2 text-foreground">
                <Mail size={16} className="text-muted-foreground" /> {email}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Role / Access</p>
              <p className="font-semibold capitalize text-foreground">Enrolled Student</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Status</p>
              <p className="font-semibold flex items-center gap-2 text-green-500">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Active Student in Good Standing
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Briefcase size={20} /> Skills & Learning Track
          </h2>
          <div className="flex flex-wrap gap-2">
            {['HTML5 & Semantic Web', 'CSS3 & Flexbox/Grid', 'Modern JavaScript (ES6+)', 'TypeScript', 'React.js', 'Node.js & Express', 'PostgreSQL Database', 'Git & GitHub Workflow', 'REST API Architecture'].map((skill) => (
              <span key={skill} className="px-3 py-1.5 bg-secondary text-foreground rounded-lg text-xs font-semibold border border-border">
                {skill}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
