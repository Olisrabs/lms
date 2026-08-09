import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Building, Camera, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi } from '../../lib/api';

export default function InstructorProfilePage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [department, setDepartment] = useState('');

  // Derived initials for avatar
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'IN';

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const profile = await usersApi.get(user.id);
        const nameParts = (profile.full_name || '').split(' ');
        setFirstName(nameParts[0] || '');
        setLastName(nameParts.slice(1).join(' ') || '');
        setEmail(profile.email || '');
        setPhone(profile.phone || '');
        // Pull extra fields from metadata if available
        const meta = (profile as any).metadata || {};
        setHeadline(meta.headline || '');
        setBio(meta.bio || '');
        setLocation(meta.location || '');
        setDepartment(meta.department || '');
      } catch (e) {
        console.warn('Failed to load profile:', e);
        // Fallback to auth context
        const nameParts = (user.full_name || '').split(' ');
        setFirstName(nameParts[0] || '');
        setLastName(nameParts.slice(1).join(' ') || '');
        setEmail(user.email || '');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await usersApi.updateProfile(user.id, {
        full_name: `${firstName} ${lastName}`.trim(),
        phone,
        metadata: { headline, bio, location, department },
      });
      setSaveMsg({ type: 'success', text: 'Profile saved successfully.' });
    } catch (e: any) {
      setSaveMsg({ type: 'error', text: e?.error || 'Failed to save profile.' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 4000);
    }
  };

  const inputClass = 'w-full bg-secondary/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Banner */}
      <div className="relative h-40 rounded-2xl overflow-hidden bg-gradient-to-r from-primary/80 to-accent/80">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}
        />
      </div>

      <div className="relative px-2">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-16 mb-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-28 h-28 rounded-2xl bg-card border-4 border-background flex items-center justify-center shadow-xl overflow-hidden">
              {loading ? (
                <div className="w-full h-full bg-secondary animate-pulse" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-3xl">
                  {initials}
                </div>
              )}
            </div>
            <button className="absolute bottom-1.5 right-1.5 p-1.5 bg-background border border-border rounded-lg shadow-sm hover:bg-secondary transition-colors">
              <Camera size={14} />
            </button>
          </div>

          {/* Name + headline */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="space-y-2">
                <div className="h-7 w-48 bg-secondary animate-pulse rounded-lg" />
                <div className="h-4 w-64 bg-secondary animate-pulse rounded-lg" />
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold">{fullName || user?.full_name || 'Instructor'}</h1>
                <p className="text-primary font-medium text-sm mt-0.5">{headline || 'Instructor'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{email}</p>
              </>
            )}
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-60 shrink-0"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

        {/* Save message */}
        {saveMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium border ${
              saveMsg.type === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-500'
                : 'bg-red-500/10 border-red-500/30 text-red-500'
            }`}
          >
            {saveMsg.text}
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl border border-border p-6 space-y-4"
          >
            <h3 className="font-bold text-base flex items-center gap-2">
              <User size={18} className="text-primary" /> Personal Details
            </h3>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-secondary animate-pulse rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-muted-foreground">First Name</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Last Name</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Title / Headline</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={headline}
                    onChange={e => setHeadline(e.target.value)}
                    placeholder="e.g. Senior Software Engineering Instructor"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Bio</label>
                  <textarea
                    rows={4}
                    className={`${inputClass} resize-none`}
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Tell students a bit about yourself…"
                  />
                </div>
              </div>
            )}
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl border border-border p-6 space-y-4"
          >
            <h3 className="font-bold text-base flex items-center gap-2">
              <Mail size={18} className="text-primary" /> Contact Information
            </h3>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-secondary animate-pulse rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-muted-foreground flex items-center gap-1.5">
                    <Mail size={12} /> Email Address
                  </label>
                  <input
                    type="email"
                    className={`${inputClass} opacity-60 cursor-not-allowed`}
                    value={email}
                    readOnly
                    title="Email cannot be changed here"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Email changes require admin assistance.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-muted-foreground flex items-center gap-1.5">
                    <Phone size={12} /> Phone Number
                  </label>
                  <input
                    type="tel"
                    className={inputClass}
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 000-0000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-muted-foreground flex items-center gap-1.5">
                    <MapPin size={12} /> Location
                  </label>
                  <input
                    type="text"
                    className={inputClass}
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Lagos, Nigeria"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-muted-foreground flex items-center gap-1.5">
                    <Building size={12} /> Department
                  </label>
                  <input
                    type="text"
                    className={inputClass}
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science & Engineering"
                  />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
