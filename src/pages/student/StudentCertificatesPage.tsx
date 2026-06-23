import { motion } from 'framer-motion';
import { Award, Download, ShieldCheck } from 'lucide-react';

const certificates = [
  { id: 1, title: 'HTML & CSS Fundamentals', date: 'Sept 15, 2026', credentialId: 'CRED-837492A', color: 'from-orange-500/20 to-orange-500/5', border: 'border-orange-500/20', icon: 'text-orange-500' },
];

export default function StudentCertificatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Certificates</h1>
        <p className="text-muted-foreground">View and download your earned certificates.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates.map((cert, i) => (
          <motion.div key={cert.id} initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay:i*0.1}} className={`glass-card rounded-2xl border ${cert.border} p-6 bg-gradient-to-br ${cert.color} relative overflow-hidden group`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className={`w-12 h-12 rounded-xl bg-background flex items-center justify-center mb-6 shadow-sm ${cert.icon}`}>
              <Award size={24} />
            </div>
            
            <h3 className="text-xl font-bold mb-2 pr-8">{cert.title}</h3>
            <p className="text-sm text-muted-foreground mb-1">Completed: {cert.date}</p>
            <p className="text-xs text-muted-foreground mb-6 font-mono">ID: {cert.credentialId}</p>
            
            <div className="flex items-center gap-3 mt-auto">
              <button className="flex-1 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                <Download size={16}/> Download
              </button>
              <button className="p-2 bg-background border border-border text-foreground rounded-xl hover:bg-secondary transition-colors" title="Verify Certificate">
                <ShieldCheck size={20}/>
              </button>
            </div>
          </motion.div>
        ))}

        <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay:0.2}} className="glass-card rounded-2xl border-2 border-dashed border-border p-6 flex flex-col items-center justify-center text-center opacity-50 grayscale">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4">
            <Award size={24} className="text-muted-foreground"/>
          </div>
          <h3 className="font-bold mb-1">JavaScript Essentials</h3>
          <p className="text-xs text-muted-foreground">Complete course to unlock</p>
        </motion.div>
      </div>
    </div>
  );
}
