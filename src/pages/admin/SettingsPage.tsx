import { useState, useEffect } from 'react';
import { 
  Building2, Palette, Bell, Mail, ShieldCheck, 
  Users, Save, User, Lock, Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi, authApi } from '../../lib/api';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Profile fields state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('prefer_not_to_say');

  // Academy Settings state
  const [academyName, setAcademyName] = useState('Modern Tech Academy');
  const [supportEmail, setSupportEmail] = useState('support@academy.edu');
  const [timezone, setTimezone] = useState('UTC');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');

  // Branding state
  const [primaryColor, setPrimaryColor] = useState('#0047d6');
  const [darkMode, setDarkMode] = useState('system');
  const [logoText, setLogoText] = useState('Make It Simple LMS');

  // Notification state
  const [signupAlerts, setSignupAlerts] = useState(true);
  const [weeklyDigests, setWeeklyDigests] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState(true);

  // Email Templates state
  const [welcomeSubject, setWelcomeSubject] = useState('Welcome to our Academy!');
  const [welcomeBody, setWelcomeBody] = useState('Hello {{name}},\n\nWelcome to {{academy_name}}! We are thrilled to have you join our learning community.');

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Load user data on mount / change
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setDob(user.date_of_birth ? user.date_of_birth.substring(0, 10) : '');
      setGender(user.gender || 'prefer_not_to_say');

      // Metadata settings
      const meta = user.metadata || {};
      if (meta.academy_name) setAcademyName(meta.academy_name);
      if (meta.support_email) setSupportEmail(meta.support_email);
      if (meta.timezone) setTimezone(meta.timezone);
      if (meta.date_format) setDateFormat(meta.date_format);

      if (meta.branding) {
        if (meta.branding.primary_color) setPrimaryColor(meta.branding.primary_color);
        if (meta.branding.dark_mode) setDarkMode(meta.branding.dark_mode);
        if (meta.branding.logo_text) setLogoText(meta.branding.logo_text);
      }

      if (meta.notifications) {
        setSignupAlerts(meta.notifications.signup_alerts ?? true);
        setWeeklyDigests(meta.notifications.weekly_digests ?? false);
        setSecurityAlerts(meta.notifications.security_alerts ?? true);
      }

      if (meta.email_templates) {
        if (meta.email_templates.welcome_subject) setWelcomeSubject(meta.email_templates.welcome_subject);
        if (meta.email_templates.welcome_body) setWelcomeBody(meta.email_templates.welcome_body);
      }
    }
  }, [user]);

  const tabs = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'academy', label: 'Academy Settings', icon: Building2 },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'email', label: 'Email Templates', icon: Mail },
    { id: 'roles', label: 'Roles & Permissions', icon: Users },
    { id: 'security', label: 'Security & Password', icon: ShieldCheck },
  ];

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (activeTab === 'profile') {
        // Update general profile details
        await usersApi.updateProfile(user.id, {
          full_name: fullName,
          phone: phone,
          date_of_birth: dob || null,
          gender: gender,
        });

        // Update local context
        updateUser({
          ...user,
          full_name: fullName,
          phone: phone,
          date_of_birth: dob || null,
          gender: gender,
        });

        showFeedback('success', 'Profile settings updated successfully!');
      } else if (activeTab === 'security') {
        if (newPassword !== confirmPassword) {
          showFeedback('error', 'New passwords do not match');
          setIsSubmitting(false);
          return;
        }

        if (newPassword.length < 10) {
          showFeedback('error', 'New password must be at least 10 characters long');
          setIsSubmitting(false);
          return;
        }

        await authApi.changePassword({
          currentPassword,
          newPassword,
        });

        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        showFeedback('success', 'Password updated successfully!');
      } else {
        // Update metadata values based on current active tab
        const currentMeta = { ...(user.metadata || {}) };

        if (activeTab === 'academy') {
          currentMeta.academy_name = academyName;
          currentMeta.support_email = supportEmail;
          currentMeta.timezone = timezone;
          currentMeta.date_format = dateFormat;
        } else if (activeTab === 'branding') {
          currentMeta.branding = {
            primary_color: primaryColor,
            dark_mode: darkMode,
            logo_text: logoText,
          };
        } else if (activeTab === 'notifications') {
          currentMeta.notifications = {
            signup_alerts: signupAlerts,
            weekly_digests: weeklyDigests,
            security_alerts: securityAlerts,
          };
        } else if (activeTab === 'email') {
          currentMeta.email_templates = {
            welcome_subject: welcomeSubject,
            welcome_body: welcomeBody,
          };
        }

        await usersApi.updateProfile(user.id, { metadata: currentMeta });

        // Update local context
        updateUser({
          ...user,
          metadata: currentMeta,
        });

        showFeedback('success', `${tabs.find(t => t.id === activeTab)?.label} saved successfully!`);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to save changes';
      showFeedback('error', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure profile and system preferences.</p>
        </div>
        {activeTab !== 'roles' && (
          <button 
            onClick={() => handleSaveSettings()}
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 w-fit disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border ${
          feedback.type === 'success' 
            ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400' 
            : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
        } text-sm font-medium transition-all`}>
          {feedback.message}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-64 shrink-0">
          <div className="glass-card rounded-3xl p-3 flex flex-col gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setFeedback(null);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 glass-card rounded-3xl p-6 lg:p-8">
          {/* PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-xl font-bold border-b border-border pb-4 flex items-center gap-2"><User size={20} className="text-primary" /> Profile Details</h3>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
                    placeholder="Full Name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1 font-medium">Email Address (Auth Account)</label>
                  <input 
                    type="email" 
                    value={user?.email || ''} 
                    disabled
                    className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-sm cursor-not-allowed text-muted-foreground font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Date of Birth</label>
                    <input 
                      type="date" 
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Gender</label>
                    <select 
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium cursor-pointer"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other / Custom</option>
                      <option value="prefer_not_to_say">Prefer Not to Say</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ACADEMY SETTINGS */}
          {activeTab === 'academy' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-xl font-bold border-b border-border pb-4 flex items-center gap-2"><Building2 size={20} className="text-primary" /> Academy Preference</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Academy Name</label>
                  <input 
                    type="text" 
                    value={academyName}
                    onChange={(e) => setAcademyName(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Support Email</label>
                  <input 
                    type="email" 
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Timezone</label>
                  <select 
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer font-medium"
                  >
                    <option value="UTC">UTC - Coordinated Universal Time</option>
                    <option value="EST">EST - Eastern Standard Time</option>
                    <option value="PST">PST - Pacific Standard Time</option>
                    <option value="WAT">WAT - West Africa Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Default Date Format</label>
                  <select 
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer font-medium"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* BRANDING */}
          {activeTab === 'branding' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-xl font-bold border-b border-border pb-4 flex items-center gap-2"><Palette size={20} className="text-primary" /> Branding Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Primary Color Theme</label>
                  <div className="flex gap-3">
                    {[
                      { hex: '#0047d6', name: 'Corporate Blue' },
                      { hex: '#EF4444', name: 'Crimson Red' },
                      { hex: '#10B981', name: 'Emerald Green' },
                      { hex: '#8B5CF6', name: 'Amethyst Violet' },
                    ].map(color => (
                      <button
                        key={color.hex}
                        onClick={() => setPrimaryColor(color.hex)}
                        className={`w-10 h-10 rounded-full border-2 transition-all relative ${
                          primaryColor === color.hex ? 'border-foreground scale-110 shadow-md' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      >
                        {primaryColor === color.hex && (
                          <span className="absolute inset-0 flex items-center justify-center text-white text-xs">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Dark Mode Preference</label>
                  <select 
                    value={darkMode}
                    onChange={(e) => setDarkMode(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer font-medium"
                  >
                    <option value="system">Follow System Preferences</option>
                    <option value="light">Always Light Mode</option>
                    <option value="dark">Always Dark Mode</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Platform Logo Text</label>
                  <input 
                    type="text" 
                    value={logoText}
                    onChange={(e) => setLogoText(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-xl font-bold border-b border-border pb-4 flex items-center gap-2"><Bell size={20} className="text-primary" /> Notification Rules</h3>
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/50">
                  <div>
                    <h4 className="font-bold text-sm mb-1">Email Alerts on User Signup</h4>
                    <p className="text-xs text-muted-foreground">Receive immediate email alerts when new students or instructors register.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={signupAlerts}
                      onChange={(e) => setSignupAlerts(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/50">
                  <div>
                    <h4 className="font-bold text-sm mb-1">Weekly Summary Digests</h4>
                    <p className="text-xs text-muted-foreground">Send an automated weekly performance digest report of all active cohorts.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={weeklyDigests}
                      onChange={(e) => setWeeklyDigests(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-sm mb-1">Security Login Emails</h4>
                    <p className="text-xs text-muted-foreground">Alert you whenever an admin account logs in from an unrecognized IP address.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={securityAlerts}
                      onChange={(e) => setSecurityAlerts(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* EMAIL TEMPLATES */}
          {activeTab === 'email' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-xl font-bold border-b border-border pb-4 flex items-center gap-2"><Mail size={20} className="text-primary" /> Welcome Email Template</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Email Subject Line</label>
                  <input 
                    type="text" 
                    value={welcomeSubject}
                    onChange={(e) => setWelcomeSubject(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Email Body Content</label>
                  <textarea 
                    value={welcomeBody}
                    onChange={(e) => setWelcomeBody(e.target.value)}
                    rows={6}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono font-medium" 
                  />
                  <span className="text-[11px] text-muted-foreground mt-1 block">Variables: {"{{name}}, {{academy_name}}"}</span>
                </div>
              </div>
            </div>
          )}

          {/* ROLES & PERMISSIONS */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold border-b border-border pb-4 flex items-center gap-2"><Users size={20} className="text-primary" /> Roles & Permissions</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-semibold">
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Scope</th>
                      <th className="py-3 px-4">Capabilities</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    <tr>
                      <td className="py-4 px-4 font-bold text-primary">Admin</td>
                      <td className="py-4 px-4 font-medium">Global System</td>
                      <td className="py-4 px-4 text-muted-foreground">Full CRUD permissions on programs, cohorts, courses, instructors, students, and settings.</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-4 font-bold text-green-600 dark:text-green-400">Instructor</td>
                      <td className="py-4 px-4 font-medium">Assigned Cohorts</td>
                      <td className="py-4 px-4 text-muted-foreground">Manage timetables, mark student attendance, create/grade assignments and tests.</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-4 font-bold text-indigo-600 dark:text-indigo-400">Student</td>
                      <td className="py-4 px-4 font-medium">Enrolled Cohort</td>
                      <td className="py-4 px-4 text-muted-foreground">Access modules and study materials, submit assignments, participate in tests and check grades.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-xl font-bold border-b border-border pb-4 flex items-center gap-2"><Lock size={20} className="text-primary" /> Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Current Password</label>
                  <input 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
                    placeholder="••••••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">New Password (Min 10 chars)</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
                    placeholder="••••••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
                    placeholder="••••••••••••"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
