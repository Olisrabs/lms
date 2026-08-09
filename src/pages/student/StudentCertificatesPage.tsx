import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Download, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface Certificate {
  id: string;
  title: string;
  issued_at?: string;
  credential_id?: string;
  template_url?: string;
  programs?: { id: string; name: string };
}

export default function StudentCertificatesPage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await api.get<Certificate[]>(`/certificates/student/${user.id}`);
        setCertificates(data || []);
      } catch (err) {
        console.error('Failed to fetch certificates', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const gradients = [
    { bg: 'from-primary/20 to-accent/10', border: 'border-primary/30', icon: 'text-primary' },
    { bg: 'from-green-500/20 to-emerald-500/10', border: 'border-green-500/30', icon: 'text-green-500' },
    { bg: 'from-purple-500/20 to-violet-500/10', border: 'border-purple-500/30', icon: 'text-purple-500' },
    { bg: 'from-orange-500/20 to-amber-500/10', border: 'border-orange-500/30', icon: 'text-orange-500' },
  ];

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Certificates</h1>
        <p className="text-muted-foreground">View and download your earned certificates.</p>
      </div>

      {certificates.length === 0 ? (
        <div className="glass-card rounded-2xl border border-dashed border-border p-16 text-center">
          <Award size={48} className="mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-xl font-bold mb-2">No Certificates Yet</h3>
          <p className="text-muted-foreground">Certificates issued by your program admin will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert, i) => {
            const style = gradients[i % gradients.length];
            return (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={`glass-card rounded-2xl border ${style.border} p-6 bg-gradient-to-br ${style.bg} relative overflow-hidden group`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

                <div className={`w-12 h-12 rounded-xl bg-background flex items-center justify-center mb-6 shadow-sm ${style.icon}`}>
                  <Award size={24} />
                </div>

                <h3 className="text-xl font-bold mb-2 pr-8">{cert.title}</h3>
                {cert.programs?.name && (
                  <p className="text-sm text-muted-foreground mb-1">Program: {cert.programs.name}</p>
                )}
                {cert.issued_at && (
                  <p className="text-sm text-muted-foreground mb-1">Issued: {new Date(cert.issued_at).toLocaleDateString()}</p>
                )}
                {cert.credential_id && (
                  <p className="text-xs text-muted-foreground mb-6 font-mono">ID: {cert.credential_id}</p>
                )}

                <div className="flex items-center gap-3 mt-auto">
                  {cert.template_url ? (
                    <a
                      href={cert.template_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                    >
                      <Download size={16} /> Download
                    </a>
                  ) : (
                    <button className="flex-1 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 opacity-60 cursor-not-allowed" disabled>
                      <Download size={16} /> Download
                    </button>
                  )}
                  <button className="p-2 bg-background border border-border text-foreground rounded-xl hover:bg-secondary transition-colors" title="Verify Certificate">
                    <ShieldCheck size={20} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
