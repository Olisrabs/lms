import { useState } from 'react';
import { motion } from 'framer-motion';
import { UsersRound, Plus, MoreVertical, FolderKanban } from 'lucide-react';

export default function InstructorGroupsPage() {
  const [groups] = useState([
    { id: 1, name: 'Team Alpha', project: 'E-Commerce App', members: 4, progress: 85 },
    { id: 2, name: 'Team Beta', project: 'Portfolio Template', members: 3, progress: 40 },
    { id: 3, name: 'Team Gamma', project: 'Chat Application', members: 5, progress: 15 },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage Groups</h1>
          <p className="text-muted-foreground">Organize students into groups for collaborative projects.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
          <Plus size={20} /> Create Group
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group, i) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-2xl border border-border p-6 flex flex-col group/card"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <UsersRound size={24} />
              </div>
              <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors">
                <MoreVertical size={18} />
              </button>
            </div>
            
            <h3 className="text-xl font-bold mb-1">{group.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <FolderKanban size={14} /> {group.project}
            </div>

            <div className="mt-auto space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-muted-foreground">Progress</span>
                <span className="font-bold">{group.progress}%</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${group.progress}%` }}></div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex -space-x-2">
                  {[...Array(group.members)].map((_, j) => (
                    <div key={j} className="w-8 h-8 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-xs font-bold">
                      {String.fromCharCode(65 + j)}
                    </div>
                  ))}
                </div>
                <button className="text-sm font-bold text-primary hover:underline">View Details</button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
