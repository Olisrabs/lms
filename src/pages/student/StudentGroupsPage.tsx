import { motion } from 'framer-motion';
import { UsersRound, Calendar } from 'lucide-react';

export default function StudentGroupsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Groups</h1>
        <p className="text-muted-foreground">Collaborate with your peers on group projects.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Workspace */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1,y:0}} className="glass-card rounded-2xl p-6 border border-border bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-primary/20">
                  <UsersRound size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Team Alpha</h2>
                  <p className="text-sm text-muted-foreground">Project: E-Commerce Frontend</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="glass-card rounded-2xl border border-border overflow-hidden">
             <div className="border-b border-border p-4 flex gap-4 overflow-x-auto text-sm font-medium text-muted-foreground">
               <button className="text-primary border-b-2 border-primary pb-1">Project</button>
               <button className="hover:text-foreground">Resources</button>
             </div>
             <div className="p-6">
               <h3 className="text-xl font-bold mb-2">E-Commerce Frontend Project</h3>
               <p className="text-muted-foreground text-sm mb-6">Work with your team to build a fully responsive frontend for an e-commerce platform using React and Tailwind CSS. Ensure you use proper state management.</p>
               
               <div className="bg-secondary/20 border border-border rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold">Project Submission</p>
                    <p className="text-xs text-muted-foreground">Only one member needs to submit the final link.</p>
                  </div>
                  <button className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm">
                    Submit Project
                  </button>
               </div>
             </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <motion.div initial={{opacity:0, x:20}} animate={{opacity:1,x:0}} className="glass-card rounded-2xl p-6 border border-border">
            <h3 className="font-bold mb-4 flex items-center gap-2"><UsersRound size={18}/> Members (4)</h3>
            <div className="space-y-3">
              {['John Doe (You)', 'Sarah Smith', 'Mike Johnson', 'Emily Davis'].map((member, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs">
                    {member.charAt(0)}
                  </div>
                  <span className="text-sm font-medium">{member}</span>
                </div>
              ))}
            </div>
          </motion.div>
          
          <motion.div initial={{opacity:0, x:20}} animate={{opacity:1,x:0}} transition={{delay:0.1}} className="glass-card rounded-2xl p-6 border border-border">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Calendar size={18}/> Deadlines</h3>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl">
                <p className="font-bold">Wireframes Approval</p>
                <p className="text-xs">Tomorrow, 5:00 PM</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
