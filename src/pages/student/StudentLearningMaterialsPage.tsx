import { motion } from 'framer-motion';
import { Search, Filter, FileText, Video, Link as LinkIcon } from 'lucide-react';

const resources = [
  { title: 'React Hooks Cheat Sheet', type: 'PDF', size: '2.4 MB', icon: FileText, color: 'text-red-500' },
  { title: 'Understanding the Event Loop', type: 'Video', size: '14 mins', icon: Video, color: 'text-blue-500' },
  { title: 'CSS Grid vs Flexbox Slides', type: 'Slides', size: '5.1 MB', icon: FileText, color: 'text-orange-500' },
  { title: 'MDN Web Docs: Array Methods', type: 'Link', size: 'External', icon: LinkIcon, color: 'text-gray-500' },
  { title: 'Frontend System Design Guide', type: 'PDF', size: '8.2 MB', icon: FileText, color: 'text-red-500' },
];

export default function StudentLearningMaterialsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Learning Materials</h1>
          <p className="text-muted-foreground">Access additional resources, slides, and study guides.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-colors">
            <Filter size={16} /> Filter
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Search resources..." 
              className="w-full sm:w-64 bg-card/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all backdrop-blur-xl"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {resources.map((res, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-5 rounded-2xl border border-border hover:shadow-lg hover:shadow-primary/5 transition-all group flex flex-col"
          >
            <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <res.icon size={24} className={res.color} />
            </div>
            <h3 className="font-bold text-base mb-1 line-clamp-2 flex-1">{res.title}</h3>
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider bg-secondary px-2 py-1 rounded-md">{res.type}</span>
              <span className="text-xs text-muted-foreground">{res.size}</span>
            </div>
            <button className="w-full mt-4 py-2 bg-primary/10 text-primary font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-colors">
              {res.type === 'Link' ? 'Open Link' : 'Download'}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
