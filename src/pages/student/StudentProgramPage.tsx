import { motion } from 'framer-motion';
import { BookOpen, Target, Calendar, User, CheckCircle2 } from 'lucide-react';

export default function StudentProgramPage() {
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-3xl p-8 border border-border relative overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
        <h1 className="text-3xl font-bold mb-4">Frontend Engineering</h1>
        <p className="text-muted-foreground max-w-3xl mb-6 text-lg">
          Master the art of building scalable, accessible, and highly interactive web applications using HTML, CSS, JavaScript, and modern frameworks like React.
        </p>
        <div className="flex flex-wrap gap-4 text-sm font-medium">
          <div className="bg-background/50 px-4 py-2 rounded-xl backdrop-blur-md border border-border flex items-center gap-2">
            <Calendar size={18} className="text-primary"/> Duration: 6 Months
          </div>
          <div className="bg-background/50 px-4 py-2 rounded-xl backdrop-blur-md border border-border flex items-center gap-2">
            <User size={18} className="text-accent"/> Coordinator: Dr. Alan Turing
          </div>
          <div className="bg-background/50 px-4 py-2 rounded-xl backdrop-blur-md border border-border flex items-center gap-2">
            <Target size={18} className="text-orange-500"/> Cohort 4 (Spring 2026)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="glass-card rounded-2xl p-6 border border-border">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><BookOpen size={20}/> Learning Outcomes</h2>
            <ul className="space-y-3">
              {[
                'Build semantic, accessible, and responsive layouts.',
                'Master ES6+ JavaScript concepts and asynchronous programming.',
                'Develop state-driven applications using React and custom Hooks.',
                'Consume RESTful APIs and handle complex data fetching.',
                'Implement robust state management using Redux or Context API.',
                'Deploy applications and configure CI/CD pipelines.'
              ].map((outcome, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-green-500 shrink-0 mt-0.5" />
                  <span className="text-foreground/90">{outcome}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className="glass-card rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold mb-4">Program Progress</h2>
            <div className="flex items-end justify-between mb-2">
              <span className="text-3xl font-bold">68%</span>
              <span className="text-sm text-muted-foreground mb-1">On Track</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2.5 mb-4">
              <div className="bg-primary h-2.5 rounded-full" style={{ width: '68%' }}></div>
            </div>
            <p className="text-sm text-muted-foreground">You have completed 3 of 5 core modules. Keep up the great work!</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
