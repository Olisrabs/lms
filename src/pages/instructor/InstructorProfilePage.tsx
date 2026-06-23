import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Building, Globe, Camera } from 'lucide-react';

export default function InstructorProfilePage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="relative h-48 rounded-2xl overflow-hidden bg-gradient-to-r from-primary/80 to-accent/80">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
      </div>

      <div className="relative px-6 pb-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-16 sm:-mt-20 mb-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-2xl bg-card border-4 border-background flex items-center justify-center shadow-xl overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-4xl">
                DR
              </div>
            </div>
            <button className="absolute bottom-2 right-2 p-2 bg-background border border-border rounded-lg shadow-sm hover:bg-secondary transition-colors">
              <Camera size={16} />
            </button>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Dr. Robert</h1>
            <p className="text-primary font-medium">Senior Software Engineering Instructor</p>
          </div>
          <button className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
            Save Changes
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl border border-border p-6 space-y-4">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><User size={20} className="text-primary"/> Personal Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">First Name</label>
                  <input type="text" defaultValue="Dr." className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Last Name</label>
                  <input type="text" defaultValue="Robert" className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Title/Headline</label>
                <input type="text" defaultValue="Senior Software Engineering Instructor" className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Bio</label>
                <textarea rows={4} defaultValue="Passionate educator and full-stack developer with 10+ years of experience building scalable web applications." className="w-full bg-secondary/30 border border-border rounded-xl p-4 focus:outline-none focus:border-primary resize-none"></textarea>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl border border-border p-6 space-y-4">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Globe size={20} className="text-primary"/> Contact Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground flex items-center gap-2"><Mail size={14}/> Email Address</label>
                <input type="email" defaultValue="robert@academy.edu" className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground flex items-center gap-2"><Phone size={14}/> Phone Number</label>
                <input type="tel" defaultValue="+1 (555) 123-4567" className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground flex items-center gap-2"><MapPin size={14}/> Location</label>
                <input type="text" defaultValue="San Francisco, CA" className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground flex items-center gap-2"><Building size={14}/> Department</label>
                <input type="text" defaultValue="Computer Science & Engineering" className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
