import { motion } from 'framer-motion';
import { Bell, Lock } from 'lucide-react';

export default function InstructorSettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-2">
          {['Account', 'Notifications', 'Security', 'Privacy', 'Appearance'].map((tab, i) => (
            <button key={tab} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-colors ${i === 0 ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="md:col-span-3 space-y-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card rounded-2xl border border-border p-6 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 text-primary rounded-lg"><Bell size={20} /></div>
              <h2 className="text-xl font-bold">Email Notifications</h2>
            </div>
            
            <div className="space-y-4 divide-y divide-border">
              {[
                { title: 'New Submissions', desc: 'Get notified when a student submits an assignment.' },
                { title: 'Direct Messages', desc: 'Receive emails for direct messages from students.' },
                { title: 'System Updates', desc: 'Platform announcements and maintenance alerts.' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between pt-4 first:pt-0">
                  <div>
                    <p className="font-bold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked={i !== 2} />
                    <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl border border-border p-6 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg"><Lock size={20} /></div>
              <h2 className="text-xl font-bold">Security</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Current Password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-muted-foreground">New Password</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Confirm New</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors">
                  Update Password
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
