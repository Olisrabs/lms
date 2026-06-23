import { motion } from 'framer-motion';
import { Megaphone, Filter, Calendar } from 'lucide-react';

const announcements = [
  { id: 1, title: 'Hackathon Registration Open!', date: 'Today, 09:00 AM', author: 'System Admin', audience: 'All Programs', content: 'Form your teams of 4 and register for the upcoming Winter Hackathon. Amazing prizes to be won!' },
  { id: 2, title: 'React Module Resources Updated', date: 'Yesterday, 04:30 PM', author: 'Instructor Sarah', audience: 'Cohort 4', content: 'I have uploaded additional reading materials and slide decks for the React Hooks module. Please review them before the next class.' },
  { id: 3, title: 'Platform Maintenance Notice', date: 'Oct 20, 2026', author: 'IT Support', audience: 'All Users', content: 'The LMS will be down for scheduled maintenance this Saturday from 2:00 AM to 4:00 AM EST.' },
];

export default function StudentAnnouncementsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">Stay updated with the latest news and notices.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-colors">
          <Filter size={16} /> Filter
        </button>
      </div>

      <div className="space-y-4">
        {announcements.map((ann, i) => (
          <motion.div key={ann.id} initial={{opacity:0, y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.1}} className="glass-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-colors group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Megaphone size={24} />
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                  <h2 className="text-xl font-bold group-hover:text-primary transition-colors">{ann.title}</h2>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium bg-secondary px-2 py-1 rounded-md w-fit">
                    <Calendar size={14}/> {ann.date}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium mb-4">
                  <span className="text-muted-foreground">From: <span className="text-foreground">{ann.author}</span></span>
                  <span className="text-border">•</span>
                  <span className="text-muted-foreground">Audience: <span className="text-foreground">{ann.audience}</span></span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{ann.content}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
