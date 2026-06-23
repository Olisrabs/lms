import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Github, Linkedin, Briefcase } from 'lucide-react';

export default function StudentProfilePage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="glass-card rounded-3xl p-8 border border-border relative overflow-hidden bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          <div className="w-32 h-32 rounded-full border-4 border-background shadow-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white text-4xl font-bold shrink-0">
            JD
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-bold mb-2">John Doe</h1>
            <p className="text-primary font-medium mb-4">Frontend Engineering • Cohort 4</p>
            <p className="text-muted-foreground text-sm max-w-2xl mb-6 leading-relaxed">
              Passionate aspiring frontend developer with a keen eye for design and user experience. Transitioning from a background in graphic design to build interactive and accessible web applications.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <span className="px-3 py-1 bg-secondary rounded-full text-xs font-medium border border-border flex items-center gap-2"><Github size={14}/> @johndoe_dev</span>
              <span className="px-3 py-1 bg-secondary rounded-full text-xs font-medium border border-border flex items-center gap-2"><Linkedin size={14}/> in/johndoe</span>
              <span className="px-3 py-1 bg-secondary rounded-full text-xs font-medium border border-border flex items-center gap-2"><Briefcase size={14}/> Portfolio</span>
            </div>
          </div>
          <button className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-sm shrink-0 hover:bg-primary/90 transition-colors">
            Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1,y:0}} className="glass-card rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><User size={20}/> Personal Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Full Name</p>
              <p className="font-medium">John Alexander Doe</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Email Address</p>
              <p className="font-medium flex items-center gap-2"><Mail size={16} className="text-muted-foreground"/> john.doe@example.com</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Phone Number</p>
              <p className="font-medium flex items-center gap-2"><Phone size={16} className="text-muted-foreground"/> +1 (555) 123-4567</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Location</p>
              <p className="font-medium flex items-center gap-2"><MapPin size={16} className="text-muted-foreground"/> New York, USA</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="glass-card rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Briefcase size={20}/> Skills</h2>
          <div className="flex flex-wrap gap-2">
            {['HTML5', 'CSS3', 'JavaScript (ES6+)', 'React.js', 'Tailwind CSS', 'Figma', 'Git & GitHub', 'Responsive Design'].map(skill => (
              <span key={skill} className="px-3 py-1.5 bg-secondary text-foreground rounded-lg text-sm font-medium border border-border">
                {skill}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
