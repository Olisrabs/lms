import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Lock, Mail, Shield, Smartphone, Eye, EyeOff, 
  CheckCircle, AlertCircle, Loader2, Save, LogOut 
} from 'lucide-react';
import { authApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentSettingsPage() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('notifications');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Notification Preferences state
  const [notifs, setNotifs] = useState(() => {
    try {
      const saved = localStorage.getItem(`student_notifs_${user?.id}`);
      return saved ? JSON.parse(saved) : {
        classReminders: true,
        assignmentDeadlines: true,
        gradesPublished: true,
        newAnnouncements: true,
        groupActivity: false,
      };
    } catch {
      return {
        classReminders: true,
        assignmentDeadlines: true,
        gradesPublished: true,
        newAnnouncements: true,
        groupActivity: false,
      };
    }
  });

  // Password state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveNotifs = () => {
    if (user?.id) {
      localStorage.setItem(`student_notifs_${user.id}`, JSON.stringify(notifs));
    }
    setSaveToast('Notification preferences saved successfully!');
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);

    if (newPw.length < 6) {
      setPwMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setSavingPw(true);
    try {
      await authApi.changePassword({ current_password: currentPw, new_password: newPw });
      setPwMsg({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err: any) {
      setPwMsg({ type: 'error', text: err?.error || err?.message || 'Failed to change password. Check your current password.' });
    } finally {
      setSavingPw(false);
      setTimeout(() => setPwMsg(null), 5000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <AnimatePresence>
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl bg-green-500/15 border border-green-500/30 text-green-500 flex items-center gap-2 text-sm font-semibold backdrop-blur-md"
          >
            <CheckCircle size={18} />
            <span>{saveToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your security credentials, notification alerts, and student preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          {[
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'security', label: 'Security & Password', icon: Lock },
            { id: 'email', label: 'Email Preferences', icon: Mail },
            { id: 'privacy', label: 'Privacy & Profile', icon: Shield },
            { id: 'devices', label: 'Connected Devices', icon: Smartphone },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
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
            {/* 1. Notifications Tab */}
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-xl font-bold mb-1">Notification Preferences</h2>
                <p className="text-xs text-muted-foreground mb-6">Select which alerts and updates you want to receive.</p>

                <div className="space-y-5">
                  {[
                    { key: 'classReminders', title: 'Class Reminders', desc: 'Get notified 30 minutes before a scheduled live class starts.' },
                    { key: 'assignmentDeadlines', title: 'Assignment Deadlines', desc: 'Alerts 24 hours before assignment due dates.' },
                    { key: 'gradesPublished', title: 'Grades & Feedback', desc: 'Immediate notification when your instructor grades a submission.' },
                    { key: 'newAnnouncements', title: 'Faculty Announcements', desc: 'Important broadcast notices from course instructors and admin.' },
                    { key: 'groupActivity', title: 'Group Workspace Activity', desc: 'Updates from your cohort capstone team members.' },
                  ].map((item) => {
                    const isChecked = !!(notifs as any)[item.key];
                    return (
                      <div key={item.key} className="flex items-start justify-between gap-4 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                        <div>
                          <h3 className="font-bold text-sm mb-0.5">{item.title}</h3>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={isChecked}
                            onChange={(e) => setNotifs({ ...notifs, [item.key]: e.target.checked })}
                          />
                          <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                        </label>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 pt-6 border-t border-border flex justify-end">
                  <button
                    onClick={handleSaveNotifs}
                    className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 cursor-pointer active:scale-95"
                  >
                    <Save size={16} /> Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* 2. Security Tab */}
            {activeTab === 'security' && (
              <div>
                <h2 className="text-xl font-bold mb-1">Security & Password</h2>
                <p className="text-xs text-muted-foreground mb-6">Update your account password to keep your profile secure.</p>

                {pwMsg && (
                  <div className={`p-3.5 rounded-xl border mb-5 text-xs font-semibold flex items-center gap-2 ${
                    pwMsg.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-red-500/10 border-red-500/30 text-red-500'
                  }`}>
                    {pwMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    <span>{pwMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-muted-foreground">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        required
                        value={currentPw}
                        onChange={(e) => setCurrentPw(e.target.value)}
                        placeholder="Enter your current password"
                        className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-sm pr-10 outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-muted-foreground">New Password</label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        required
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        placeholder="Enter new password (min. 6 characters)"
                        className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-sm pr-10 outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-muted-foreground">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={savingPw}
                      className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 cursor-pointer active:scale-95"
                    >
                      {savingPw ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                      {savingPw ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 3. Email Preferences Tab */}
            {activeTab === 'email' && (
              <div>
                <h2 className="text-xl font-bold mb-1">Email Digest & Preferences</h2>
                <p className="text-xs text-muted-foreground mb-6">Manage how and when Make It Simple emails your inbox at <strong className="text-foreground">{user?.email}</strong>.</p>

                <div className="space-y-4">
                  {[
                    { title: 'Weekly Progress Digest', desc: 'Every Monday morning summary of your attendance, test scores, and weekly tasks.' },
                    { title: 'Immediate Class Notifications', desc: 'Direct invitations to join live class rooms via Google Meet / Zoom.' },
                    { title: 'Marketing & Bootcamp Opportunities', desc: 'Occasional announcements about new tracks, masterclasses, and tech fellowships.' },
                  ].map((pref, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl border border-border">
                      <div>
                        <p className="font-semibold text-sm">{pref.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{pref.desc}</p>
                      </div>
                      <input type="checkbox" defaultChecked={i < 2} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Privacy Tab */}
            {activeTab === 'privacy' && (
              <div>
                <h2 className="text-xl font-bold mb-1">Privacy & Visibility</h2>
                <p className="text-xs text-muted-foreground mb-6">Control what peer students and mentors can see in your cohort directory.</p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl border border-border">
                    <div>
                      <p className="font-semibold text-sm">Visible in Peer Directory</p>
                      <p className="text-xs text-muted-foreground">Allow fellow cohort members to view your name and project collaborations.</p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl border border-border">
                    <div>
                      <p className="font-semibold text-sm">Display GitHub & LinkedIn Profiles</p>
                      <p className="text-xs text-muted-foreground">Show links to your coding repositories and LinkedIn profile on project badges.</p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                  </div>
                </div>
              </div>
            )}

            {/* 5. Connected Devices Tab */}
            {activeTab === 'devices' && (
              <div>
                <h2 className="text-xl font-bold mb-1">Active Sessions & Devices</h2>
                <p className="text-xs text-muted-foreground mb-6">Devices currently authenticated to your student account.</p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-primary/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-sm flex items-center gap-2">
                          Current Browser Session
                          <span className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full font-semibold">Active Now</span>
                        </p>
                        <p className="text-xs text-muted-foreground">Web Browser · Windows NT · Last used just now</p>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors text-xs font-bold"
                >
                  <LogOut size={16} /> Sign Out of All Devices
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
