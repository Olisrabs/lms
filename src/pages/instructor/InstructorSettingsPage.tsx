import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Lock, User, Shield, Sun, Moon, Monitor,
  Loader2, CheckCircle, Eye, EyeOff, Save
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi, authApi } from '../../lib/api';

type Tab = 'Account' | 'Notifications' | 'Security' | 'Privacy' | 'Appearance';

const TABS: { id: Tab; icon: React.ElementType }[] = [
  { id: 'Account', icon: User },
  { id: 'Notifications', icon: Bell },
  { id: 'Security', icon: Lock },
  { id: 'Privacy', icon: Shield },
  { id: 'Appearance', icon: Sun },
];

const inputClass = 'w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all';

function SectionHeader({ title, subtitle, icon: Icon, color = 'primary' }: {
  title: string; subtitle: string; icon: React.ElementType; color?: string
}) {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    orange: 'bg-orange-500/10 text-orange-500',
    red: 'bg-red-500/10 text-red-500',
    purple: 'bg-purple-500/10 text-purple-500',
    blue: 'bg-blue-500/10 text-blue-500',
  };
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`p-2.5 rounded-xl ${colorMap[color] || colorMap.primary}`}>
        <Icon size={20} />
      </div>
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function StatusBanner({ msg }: { msg: { type: 'success' | 'error'; text: string } | null }) {
  if (!msg) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium border flex items-center gap-2 ${
        msg.type === 'success'
          ? 'bg-green-500/10 border-green-500/30 text-green-500'
          : 'bg-red-500/10 border-red-500/30 text-red-500'
      }`}
    >
      <CheckCircle size={15} />
      {msg.text}
    </motion.div>
  );
}

// ─── Tab: Account ─────────────────────────────────────────────────────────────
function AccountTab() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      try {
        const profile = await usersApi.get(user.id);
        setFullName(profile.full_name || '');
        setEmail(profile.email || '');
        setPhone(profile.phone || '');
      } catch {
        setFullName(user.full_name || '');
        setEmail(user.email || '');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const save = async () => {
    if (!user?.id) return;
    setSaving(true);
    setMsg(null);
    try {
      await usersApi.updateProfile(user.id, { full_name: fullName, phone });
      setMsg({ type: 'success', text: 'Account info updated successfully.' });
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.error || 'Failed to save changes.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  if (loading) return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-12 bg-secondary animate-pulse rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-5">
      <SectionHeader icon={User} title="Account Information" subtitle="Update your public profile details." />
      <StatusBanner msg={msg} />
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Full Name</label>
        <input type="text" className={inputClass} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" />
      </div>
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Email Address</label>
        <input type="email" className={`${inputClass} opacity-60 cursor-not-allowed`} value={email} readOnly title="Email changes require admin assistance" />
        <p className="text-[11px] text-muted-foreground mt-1">Contact admin to update your email address.</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Phone Number</label>
        <input type="tel" className={inputClass} value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +234 801 234 5678" />
      </div>
      <div className="pt-2 flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60 text-sm"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

// ─── Tab: Notifications ───────────────────────────────────────────────────────
function NotificationsTab() {
  const { user } = useAuth();
  const PREF_KEY = `instructor_notif_prefs_${user?.id}`;

  const defaults = {
    newSubmissions: true,
    directMessages: true,
    systemUpdates: false,
    gradeActivity: true,
    upcomingClasses: true,
    weeklyReport: false,
  };

  const [prefs, setPrefs] = useState(() => {
    try {
      const stored = localStorage.getItem(PREF_KEY);
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch { return defaults; }
  });
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof typeof prefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    localStorage.setItem(PREF_KEY, JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const items: { key: keyof typeof prefs; title: string; desc: string }[] = [
    { key: 'newSubmissions', title: 'New Submissions', desc: 'Get notified when a student submits an assignment or capstone.' },
    { key: 'directMessages', title: 'Direct Messages', desc: 'Receive alerts for direct messages from students.' },
    { key: 'gradeActivity', title: 'Grade Activity', desc: 'Notifications when students receive grades or feedback.' },
    { key: 'upcomingClasses', title: 'Upcoming Classes', desc: 'Remind me 1 hour before a scheduled class session.' },
    { key: 'weeklyReport', title: 'Weekly Performance Report', desc: 'Email summary of cohort performance every Monday.' },
    { key: 'systemUpdates', title: 'System Updates', desc: 'Platform announcements, maintenance alerts and new features.' },
  ];

  return (
    <div>
      <SectionHeader icon={Bell} title="Notification Preferences" subtitle="Choose what you want to be notified about." color="primary" />
      {saved && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-4 py-2.5 rounded-xl text-sm font-medium bg-green-500/10 border border-green-500/30 text-green-500 flex items-center gap-2"
        >
          <CheckCircle size={14} /> Preferences saved automatically.
        </motion.div>
      )}
      <div className="space-y-1 divide-y divide-border">
        {items.map(item => (
          <div key={String(item.key)} className="flex items-center justify-between py-4 first:pt-0">
            <div>
              <p className="font-semibold text-sm">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
            <button
              onClick={() => toggle(item.key)}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-4 ${prefs[item.key] ? 'bg-primary' : 'bg-secondary'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs[item.key] ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Security ────────────────────────────────────────────────────────────
function SecurityTab() {
  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const strength = !newPw ? 0 : newPw.length < 6 ? 1 : newPw.length < 10 ? 2 : /[A-Z]/.test(newPw) && /[0-9]/.test(newPw) ? 4 : 3;
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-green-500'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (newPw !== confirm) { setMsg({ type: 'error', text: 'New passwords do not match.' }); return; }
    if (newPw.length < 6) { setMsg({ type: 'error', text: 'Password must be at least 6 characters.' }); return; }
    setSaving(true);
    try {
      await authApi.changePassword({ current_password: current, new_password: newPw });
      setMsg({ type: 'success', text: 'Password changed successfully.' });
      setCurrent(''); setNewPw(''); setConfirm('');
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.error || 'Failed to change password. Check your current password.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 5000);
    }
  };

  return (
    <div>
      <SectionHeader icon={Lock} title="Security Settings" subtitle="Manage your password and account security." color="orange" />
      <form onSubmit={handleSubmit} className="space-y-4">
        <StatusBanner msg={msg} />
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Current Password</label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              className={`${inputClass} pr-10`}
              placeholder="Enter current password"
              value={current}
              onChange={e => setCurrent(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                className={`${inputClass} pr-10`}
                placeholder="New password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {newPw && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(l => (
                    <div key={l} className={`h-1 flex-1 rounded-full transition-colors ${strength >= l ? strengthColor[strength] : 'bg-border'}`} />
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">Strength: <span className="font-semibold">{strengthLabel[strength]}</span></p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Confirm New Password</label>
            <input
              type="password"
              className={`${inputClass} ${confirm && confirm !== newPw ? 'border-red-500 focus:ring-red-500/30' : ''}`}
              placeholder="Repeat new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
            {confirm && confirm !== newPw && (
              <p className="text-[11px] text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>
        </div>
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60 text-sm"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
            {saving ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Tab: Privacy ─────────────────────────────────────────────────────────────
function PrivacyTab() {
  const { user } = useAuth();
  const PREF_KEY = `instructor_privacy_prefs_${user?.id}`;

  const defaults = {
    showProfile: true,
    showEmail: false,
    showPhone: false,
    showActivity: true,
    allowStudentMessages: true,
  };

  const [prefs, setPrefs] = useState(() => {
    try {
      const stored = localStorage.getItem(PREF_KEY);
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch { return defaults; }
  });
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof typeof prefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    localStorage.setItem(PREF_KEY, JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const items: { key: keyof typeof prefs; title: string; desc: string }[] = [
    { key: 'showProfile', title: 'Public Profile', desc: 'Allow students and other instructors to view your profile page.' },
    { key: 'showEmail', title: 'Show Email Address', desc: 'Display your email on your public profile.' },
    { key: 'showPhone', title: 'Show Phone Number', desc: 'Display your phone number on your public profile.' },
    { key: 'showActivity', title: 'Show Online Activity', desc: 'Let students see when you were last active.' },
    { key: 'allowStudentMessages', title: 'Allow Student Messages', desc: 'Students can send you direct messages through the platform.' },
  ];

  return (
    <div>
      <SectionHeader icon={Shield} title="Privacy Settings" subtitle="Control what information others can see." color="purple" />
      {saved && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-4 py-2.5 rounded-xl text-sm font-medium bg-green-500/10 border border-green-500/30 text-green-500 flex items-center gap-2"
        >
          <CheckCircle size={14} /> Preferences saved.
        </motion.div>
      )}
      <div className="space-y-1 divide-y divide-border">
        {items.map(item => (
          <div key={String(item.key)} className="flex items-center justify-between py-4 first:pt-0">
            <div>
              <p className="font-semibold text-sm">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
            <button
              onClick={() => toggle(item.key)}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-4 ${prefs[item.key] ? 'bg-primary' : 'bg-secondary'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs[item.key] ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Appearance ──────────────────────────────────────────────────────────
function AppearanceTab() {
  const THEME_KEY = 'edule_theme';
  const ACCENT_KEY = 'edule_accent';

  const themes = [
    { id: 'light', label: 'Light', icon: Sun, desc: 'Clean and bright interface' },
    { id: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on the eyes at night' },
    { id: 'system', label: 'System', icon: Monitor, desc: 'Follows your OS preference' },
  ];

  const accents = [
    { id: '#0047d6', label: 'Blue', class: 'bg-[#0047d6]' },
    { id: '#7c3aed', label: 'Violet', class: 'bg-violet-600' },
    { id: '#059669', label: 'Emerald', class: 'bg-emerald-600' },
    { id: '#d97706', label: 'Amber', class: 'bg-amber-600' },
    { id: '#dc2626', label: 'Red', class: 'bg-red-600' },
  ];

  const [selectedTheme, setSelectedTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'system');
  const [selectedAccent, setSelectedAccent] = useState(() => localStorage.getItem(ACCENT_KEY) || '#0047d6');
  const [saved, setSaved] = useState(false);

  const applyTheme = (themeId: string) => {
    setSelectedTheme(themeId);
    localStorage.setItem(THEME_KEY, themeId);
    const root = document.documentElement;
    if (themeId === 'dark') {
      root.classList.add('dark');
    } else if (themeId === 'light') {
      root.classList.remove('dark');
    } else {
      // System
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', systemDark);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const applyAccent = (accentId: string) => {
    setSelectedAccent(accentId);
    localStorage.setItem(ACCENT_KEY, accentId);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8">
      <SectionHeader icon={Sun} title="Appearance" subtitle="Customize the look and feel of your interface." color="blue" />
      {saved && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="px-4 py-2.5 rounded-xl text-sm font-medium bg-green-500/10 border border-green-500/30 text-green-500 flex items-center gap-2"
        >
          <CheckCircle size={14} /> Preference applied.
        </motion.div>
      )}

      {/* Theme */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Theme Mode</h3>
        <div className="grid grid-cols-3 gap-3">
          {themes.map(({ id, label, icon: Icon, desc }) => (
            <button
              key={id}
              onClick={() => applyTheme(id)}
              className={`p-4 rounded-xl border-2 text-left transition-all hover:border-primary/50 ${selectedTheme === id ? 'border-primary bg-primary/5' : 'border-border bg-secondary/20'}`}
            >
              <Icon size={22} className={selectedTheme === id ? 'text-primary' : 'text-muted-foreground'} />
              <p className={`text-sm font-bold mt-2 ${selectedTheme === id ? 'text-primary' : ''}`}>{label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Accent Color</h3>
        <div className="flex gap-3 flex-wrap">
          {accents.map(acc => (
            <button
              key={acc.id}
              onClick={() => applyAccent(acc.id)}
              title={acc.label}
              className={`w-10 h-10 rounded-xl ${acc.class} transition-all ${selectedAccent === acc.id ? 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
            />
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">Accent color affects buttons, links and active states throughout the interface.</p>
      </div>

      {/* Font size */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Text Density</h3>
        <div className="grid grid-cols-3 gap-3">
          {['Compact', 'Default', 'Comfortable'].map((size) => {
            const selected = (localStorage.getItem('edule_density') || 'Default') === size;
            return (
              <button
                key={size}
                onClick={() => { localStorage.setItem('edule_density', size); setSaved(true); setTimeout(() => setSaved(false), 2000); }}
                className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${selected ? 'border-primary text-primary bg-primary/5' : 'border-border text-muted-foreground hover:border-primary/40'}`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
export default function InstructorSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Account');

  const tabContent: Record<Tab, React.ReactNode> = {
    Account: <AccountTab />,
    Notifications: <NotificationsTab />,
    Security: <SecurityTab />,
    Privacy: <PrivacyTab />,
    Appearance: <AppearanceTab />,
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account preferences, security, and appearance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar nav */}
        <div className="md:col-span-1 space-y-1">
          {TABS.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === id
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              }`}
            >
              <Icon size={16} />
              {id}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="md:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="glass-card rounded-2xl border border-border p-6"
            >
              {tabContent[activeTab]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
