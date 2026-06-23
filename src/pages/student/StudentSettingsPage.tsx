import { motion } from 'framer-motion';
import { Bell, Lock, Mail, Shield, Smartphone } from 'lucide-react';
import { useState } from 'react';

export default function StudentSettingsPage() {
  const [activeTab, setActiveTab] = useState('notifications');

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and notifications.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          {[
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'security', label: 'Security & Password', icon: Lock },
            { id: 'email', label: 'Email Preferences', icon: Mail },
            { id: 'privacy', label: 'Privacy', icon: Shield },
            { id: 'devices', label: 'Connected Devices', icon: Smartphone },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card rounded-2xl p-6 sm:p-8 border border-border"
          >
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-xl font-bold mb-6">Notification Preferences</h2>
                <div className="space-y-6">
                  {[
                    { title: 'Class Reminders', desc: 'Get notified when a live class is starting soon.' },
                    { title: 'Assignment Deadlines', desc: 'Alerts for upcoming and overdue assignments.' },
                    { title: 'Grades Published', desc: 'Notifications when an assignment or test is graded.' },
                    { title: 'New Announcements', desc: 'Important platform and cohort announcements.' },
                    { title: 'Group Activity', desc: 'Mentions and task updates in your group workspace.' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start justify-between gap-4 pb-6 border-b border-border/50 last:border-0 last:pb-0">
                      <div>
                        <h3 className="font-bold text-sm mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                        <input type="checkbox" className="sr-only peer" defaultChecked={i < 4} />
                        <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-border flex justify-end">
                  <button className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-sm hover:bg-primary/90 transition-colors">
                    Save Preferences
                  </button>
                </div>
              </div>
            )}
            
            {activeTab !== 'notifications' && (
              <div className="text-center py-12 text-muted-foreground">
                Settings for {activeTab} will appear here.
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
