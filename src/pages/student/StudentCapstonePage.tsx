import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, UploadCloud, Link as LinkIcon, CheckCircle2, Loader2, FileCheck, X } from 'lucide-react';
import { capstonesApi, gradesApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface Capstone {
  id: string;
  title: string;
  description?: string;
  status: string;
  score?: number | null;
  feedback?: string;
  submitted_at?: string;
}

export default function StudentCapstonePage() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [capstone, setCapstone] = useState<Capstone | null>(null);
  const [cohortId, setCohortId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const grades = await gradesApi.getStudentGrades(user.id) as any[];
        const cId = grades?.[0]?.cohorts?.id;
        setCohortId(cId || null);
        if (cId) {
          const data = await capstonesApi.list(cId) as Capstone[];
          setCapstone(data?.[0] || null);
        }
      } catch (err) {
        console.error('Failed to load capstone', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link.trim() || !cohortId) return;
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('cohort_id', cohortId);
      formData.append('title', 'Capstone Project');
      formData.append('description', `${notes.trim()}${link ? `\n\nProject Link: ${link.trim()}` : ''}`);
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      await capstonesApi.submit(formData);
      const updated = await capstonesApi.list(cohortId) as Capstone[];
      setCapstone(updated?.[0] || null);
      setSuccess('Capstone submitted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.error || 'Failed to submit capstone.');
    } finally {
      setSubmitting(false);
    }
  };

  const getGrade = (score: number | null | undefined) => {
    if (score === null || score === undefined) return null;
    if (score >= 90) return { letter: 'A', color: 'text-green-500' };
    if (score >= 80) return { letter: 'B', color: 'text-blue-500' };
    if (score >= 70) return { letter: 'C', color: 'text-yellow-500' };
    if (score >= 60) return { letter: 'D', color: 'text-orange-500' };
    return { letter: 'F', color: 'text-red-500' };
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  if (!cohortId && !loading) {
    return (
      <div className="glass-card rounded-2xl border border-dashed border-border p-16 text-center">
        <Trophy size={48} className="mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-xl font-bold mb-2">No Active Capstone</h3>
        <p className="text-muted-foreground">Your instructor hasn't set a capstone project yet.</p>
      </div>
    );
  }

  const isSubmitted = capstone?.status === 'submitted' || capstone?.status === 'approved' || capstone?.status === 'reviewing';
  const grade = getGrade(capstone?.score);

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="glass-card rounded-3xl p-8 border border-border relative overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-sm mb-2">
              <span className="bg-primary/20 px-3 py-1 rounded-full"><Trophy size={14} className="inline mr-1" /> Capstone Project</span>
            </div>
            <h1 className="text-3xl font-bold">{capstone?.title || 'Final Capstone Project'}</h1>
            <p className="text-muted-foreground mt-2">
              Status: <span className={`font-semibold ${isSubmitted ? 'text-green-500' : 'text-orange-500'} capitalize`}>
                {capstone?.status || 'Not Submitted'}
              </span>
            </p>
          </div>
          {capstone?.score != null && grade && (
            <div className="bg-card/80 backdrop-blur-md p-4 rounded-xl border border-border text-center">
              <p className="text-sm font-bold text-muted-foreground mb-1">Grade</p>
              <p className="text-3xl font-black text-primary">{capstone.score}%</p>
              <p className={`text-2xl font-black ${grade.color}`}>{grade.letter}</p>
            </div>
          )}
        </div>
      </div>

      {success && <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm font-semibold">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submission form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold mb-4">Project Submission</h2>
          {capstone?.description && (
            <p className="text-sm text-muted-foreground mb-6">{capstone.description}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Project Link *</label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  type="url"
                  value={link}
                  onChange={e => setLink(e.target.value)}
                  disabled={isSubmitted}
                  placeholder="https://github.com/..."
                  className="w-full bg-secondary/50 border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Project Description / Notes</label>
              <textarea
                rows={4}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                disabled={isSubmitted}
                placeholder="Briefly describe your project..."
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Upload Project Archive / File (Optional)</label>
              <div 
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl p-4 text-center hover:bg-secondary/30 transition-colors cursor-pointer text-muted-foreground"
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2 text-primary font-semibold text-xs">
                    <FileCheck size={20} className="text-green-500" />
                    <span>{selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        if (fileRef.current) fileRef.current.value = '';
                      }}
                      className="p-1 hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <UploadCloud size={24} className="mx-auto mb-2 text-primary" />
                    <p className="text-xs font-medium">Click to select project file (ZIP, PDF, TAR.GZ)</p>
                  </>
                )}
              </div>
              <input
                type="file"
                ref={fileRef}
                onChange={(e) => {
                  if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                }}
                className="hidden"
              />
            </div>
            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">{error}</div>}
            <button
              type="submit"
              disabled={isSubmitted || submitting}
              className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl mt-4 hover:bg-primary/90 transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {isSubmitted ? 'Capstone Submitted' : submitting ? 'Submitting...' : 'Submit Capstone'}
            </button>
          </form>
        </motion.div>

        {/* Status & Feedback */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6 border border-border h-fit">
          <h2 className="text-xl font-bold mb-4">Status & Feedback</h2>
          {capstone ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border flex items-start gap-4 ${isSubmitted ? 'bg-green-500/5 border-green-500/20' : 'bg-secondary/20 border-border'}`}>
                <div className={`mt-0.5 shrink-0 ${isSubmitted ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {isSubmitted ? <CheckCircle2 size={24} /> : <Trophy size={24} />}
                </div>
                <div>
                  <h3 className="font-bold capitalize">{capstone.status || 'Draft'}</h3>
                  {capstone.submitted_at && (
                    <p className="text-sm text-muted-foreground">Submitted: {new Date(capstone.submitted_at).toLocaleDateString()}</p>
                  )}
                  {capstone.feedback && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold mb-1">Instructor Feedback:</p>
                      <p className="text-sm text-muted-foreground">{capstone.feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Submit your capstone to see feedback here.</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
