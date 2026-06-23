import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, FileText, Download, FileArchive, Image as ImageIcon, MoreVertical } from 'lucide-react';

export default function InstructorMaterialsPage() {
  const [materials] = useState([
    { id: 1, name: 'React Cheat Sheet 2026.pdf', type: 'document', size: '2.4 MB', course: 'React Fundamentals', downloads: 145 },
    { id: 2, name: 'UI Components Zip File', type: 'archive', size: '15.8 MB', course: 'UI/UX Basics', downloads: 82 },
    { id: 3, name: 'Architecture Diagram.png', type: 'image', size: '1.2 MB', course: 'Advanced State Management', downloads: 34 },
  ]);

  const getIcon = (type: string) => {
    switch(type) {
      case 'document': return <FileText size={20} className="text-blue-500" />;
      case 'archive': return <FileArchive size={20} className="text-orange-500" />;
      case 'image': return <ImageIcon size={20} className="text-green-500" />;
      default: return <FileText size={20} className="text-primary" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Learning Materials</h1>
          <p className="text-muted-foreground">Upload and manage resources for your courses.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
          <Plus size={20} /> Upload Material
        </button>
      </div>

      <div className="glass-card rounded-2xl border border-border p-4 flex gap-4 overflow-x-auto text-sm font-medium">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input type="text" placeholder="Search materials..." className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select className="bg-secondary/50 border border-border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option>All Types</option>
          <option>Documents (PDF, DOCX)</option>
          <option>Archives (ZIP, RAR)</option>
          <option>Images (PNG, JPG)</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map((mat, i) => (
          <motion.div
            key={mat.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-2xl border border-border p-5 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                  {getIcon(mat.type)}
                </div>
                <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>
              <h3 className="font-bold text-base mb-1 group-hover:text-primary transition-colors line-clamp-2">{mat.name}</h3>
              <p className="text-xs text-muted-foreground mb-4">{mat.course}</p>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-xs font-medium text-muted-foreground">{mat.size}</span>
              <span className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                <Download size={12} /> {mat.downloads}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
