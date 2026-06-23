import { motion } from 'framer-motion';
import { Trophy, UploadCloud, Link as LinkIcon, CheckCircle2 } from 'lucide-react';

export default function StudentCapstonePage() {
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-3xl p-8 border border-border relative overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-sm mb-2">
              <span className="bg-primary/20 px-3 py-1 rounded-full"><Trophy size={14} className="inline mr-1"/> Active Capstone</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Final Capstone Project</h1>
            <p className="text-muted-foreground mt-2">Individual Final Project • Status: <span className="text-orange-500 font-semibold">Pending</span></p>
          </div>
          <div className="text-right bg-card/80 backdrop-blur-md p-4 rounded-xl border border-border">
            <p className="text-sm font-bold text-muted-foreground">Deadline</p>
            <p className="text-xl font-bold text-red-500">Dec 15, 2026</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1,y:0}} className="glass-card rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold mb-4">Project Submission</h2>
          <p className="text-sm text-muted-foreground mb-6">Submit your final project. Please provide the relevant links (e.g. Website, Figma, Google Drive, Video link) and any necessary files or documents based on your skillset.</p>
          
          <form className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Primary Project Link</label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16}/>
                <input type="url" placeholder="https://..." className="w-full bg-secondary/50 border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none" required />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Additional Link (Optional)</label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16}/>
                <input type="url" placeholder="https://..." className="w-full bg-secondary/50 border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Project Description / Notes</label>
              <textarea rows={4} placeholder="Briefly describe your project..." className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none" required></textarea>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Upload File (Optional)</label>
              <div className="w-full border-2 border-dashed border-border rounded-xl p-4 text-center hover:bg-secondary/30 transition-colors cursor-pointer text-muted-foreground">
                <UploadCloud size={24} className="mx-auto mb-2" />
                <p className="text-xs">Click to upload file (PDF, ZIP, MP4, etc.)</p>
              </div>
            </div>
            <button type="button" className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl mt-4 hover:bg-primary/90 transition-colors flex justify-center items-center gap-2">
              Submit Capstone
            </button>
          </form>
        </motion.div>

        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="glass-card rounded-2xl p-6 border border-border h-fit">
          <h2 className="text-xl font-bold mb-4">Completed Projects</h2>
          <div className="space-y-4">
             <div className="p-4 rounded-xl border bg-green-500/5 border-green-500/20 flex items-start gap-4">
               <div className="mt-0.5 shrink-0 text-green-500">
                 <CheckCircle2 size={24} />
               </div>
               <div>
                 <h3 className="font-bold text-foreground">Midterm Project</h3>
                 <p className="text-sm text-muted-foreground">Submitted on Oct 10, 2026</p>
               </div>
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
