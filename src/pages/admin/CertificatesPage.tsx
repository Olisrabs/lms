import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Plus, Upload, Loader2, X, Download, Trash2, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api';
import { programsApi } from '../../lib/api';

interface Certificate {
  id: string;
  title: string;
  program_id?: string;
  template_url?: string;
  issued_at?: string;
  credential_id?: string;
  created_at?: string;
  programs?: { id: string; name: string };
}

interface Program {
  id: string;
  name: string;
}

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [form, setForm] = useState({ title: '', program_id: '', description: '' });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [certs, progs] = await Promise.all([
          api.get<Certificate[]>('/certificates'),
          programsApi.list() as Promise<Program[]>,
        ]);
        setCertificates(certs || []);
        setPrograms(progs || []);
      } catch (err) {
        console.error('Failed to load', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.program_id) return;
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('program_id', form.program_id);
      formData.append('description', form.description);
      if (templateFile) formData.append('template', templateFile);

      await api.post('/certificates', formData);
      const updated = await api.get<Certificate[]>('/certificates');
      setCertificates(updated || []);
      setSuccess('Certificate template created successfully!');
      setShowModal(false);
      setForm({ title: '', program_id: '', description: '' });
      setTemplateFile(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.error || 'Failed to create certificate.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this certificate?')) return;
    try {
      await api.delete(`/certificates/${id}`);
      setCertificates(c => c.filter(cert => cert.id !== id));
    } catch (err) {
      console.error('Failed to delete certificate', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Certificates</h1>
          <p className="text-muted-foreground">Create and manage program completion certificates.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <Plus size={20} /> Create Certificate
        </button>
      </div>

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm font-semibold">{success}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : certificates.length === 0 ? (
        <div className="glass-card rounded-2xl border border-dashed border-border p-16 text-center">
          <Award size={48} className="mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-xl font-bold mb-2">No Certificates Yet</h3>
          <p className="text-muted-foreground mb-6">Create certificate templates for your programs. Students will receive them automatically on completion.</p>
          <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90">
            <Plus size={18} /> Create Certificate
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert, i) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-2xl border border-border p-6 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Award size={24} />
                </div>
                <button
                  onClick={() => handleDelete(cert.id)}
                  className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <h3 className="text-xl font-bold mb-1">{cert.title}</h3>
              {cert.programs?.name && (
                <p className="text-sm text-muted-foreground mb-1">Program: {cert.programs.name}</p>
              )}
              {cert.created_at && (
                <p className="text-xs text-muted-foreground mb-4">Created: {new Date(cert.created_at).toLocaleDateString()}</p>
              )}

              <div className="flex items-center gap-3 border-t border-border pt-4">
                {cert.template_url ? (
                  <a href={cert.template_url} download target="_blank" rel="noopener noreferrer"
                    className="flex-1 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
                    <Download size={16} /> View Template
                  </a>
                ) : (
                  <div className="flex-1 py-2 bg-secondary rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-muted-foreground">
                    No Template
                  </div>
                )}
                <button className="p-2 bg-secondary border border-border rounded-xl hover:bg-secondary/80 transition-colors" title="Verify">
                  <ShieldCheck size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Create Certificate</h2>
                <button onClick={() => { setShowModal(false); setError(null); }} className="p-2 hover:bg-secondary rounded-xl">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="text-sm font-medium mb-1 block">Certificate Title *</label>
                  <input type="text" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Frontend Development Certificate"
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Program *</label>
                  <select required value={form.program_id} onChange={e => setForm(f => ({ ...f, program_id: e.target.value }))}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="">Select a program...</option>
                    {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Description (Optional)</label>
                  <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Describe what this certificate recognizes..."
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Certificate Template Design *
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">Upload your certificate design (PNG, PDF). Student details will be auto-filled.</p>
                  <label className="w-full border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-secondary/30 transition-colors cursor-pointer flex flex-col items-center gap-2">
                    <Upload size={24} className={templateFile ? 'text-primary' : 'text-muted-foreground'} />
                    <span className="text-sm font-medium">{templateFile ? templateFile.name : 'Click to upload template'}</span>
                    <span className="text-xs text-muted-foreground">PNG, PDF, JPG (max 10MB)</span>
                    <input type="file" accept=".png,.pdf,.jpg,.jpeg" className="hidden"
                      onChange={e => setTemplateFile(e.target.files?.[0] || null)} />
                  </label>
                </div>

                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">{error}</div>}

                <div className="flex gap-3">
                  <button type="button" onClick={() => { setShowModal(false); setError(null); }}
                    className="flex-1 py-2.5 bg-secondary rounded-xl font-bold hover:bg-secondary/80 transition-colors">Cancel</button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Award size={16} />}
                    {submitting ? 'Creating...' : 'Create Certificate'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
