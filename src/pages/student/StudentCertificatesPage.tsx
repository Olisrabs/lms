import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Download, ShieldCheck, Loader2, X } from 'lucide-react';
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
  const [verifyingCert, setVerifyingCert] = useState<Certificate | null>(null);

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
        <p className="text-muted-foreground mt-1">Official credentials and certificates earned upon program completion.</p>
      </div>

      {certificates.length === 0 ? (
        <div className="glass-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
          <Award size={48} className="mx-auto mb-3 opacity-30 text-primary" />
          <p className="text-lg font-bold text-foreground">No certificates earned yet</p>
          <p className="text-sm mt-1 max-w-md mx-auto">
            Complete your program requirements and pass your final capstone project to receive your verified certificate of completion.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert, i) => {
            const style = gradients[i % gradients.length];
            return (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`glass-card rounded-2xl border ${style.border} p-6 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br ${style.bg}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-card/80 border border-border flex items-center justify-center shadow-md">
                    <Award size={28} className={style.icon} />
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                    Verified
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-1 text-foreground">{cert.title}</h3>
                {cert.programs?.name && (
                  <p className="text-sm text-muted-foreground mb-1">Program: {cert.programs.name}</p>
                )}
                {cert.issued_at && (
                  <p className="text-sm text-muted-foreground mb-1">Issued: {new Date(cert.issued_at).toLocaleDateString()}</p>
                )}
                {cert.credential_id && (
                  <p className="text-xs text-muted-foreground mb-6 font-mono">ID: {cert.credential_id}</p>
                )}

                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-border/40">
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
                    <button 
                      onClick={() => {
                        const blob = new Blob([`Make It Simple Certificate\n\nTitle: ${cert.title}\nRecipient: ${user?.full_name}\nCredential ID: ${cert.credential_id || 'CERT-' + cert.id}\nIssued: ${cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : 'N/A'}`], { type: 'text/plain' });
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = `certificate_${cert.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.txt`;
                        link.click();
                      }}
                      className="flex-1 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 cursor-pointer"
                    >
                      <Download size={16} /> Download Record
                    </button>
                  )}
                  <button 
                    onClick={() => setVerifyingCert(cert)}
                    className="p-2.5 bg-background border border-border text-foreground rounded-xl hover:bg-secondary transition-colors cursor-pointer" 
                    title="Verify Certificate Authenticity"
                  >
                    <ShieldCheck size={18} className="text-green-500" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Verification Modal */}
      <AnimatePresence>
        {verifyingCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => setVerifyingCert(null)}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-colors"
              >
                <X size={18} />
              </button>

              <div className="text-center space-y-3 mb-6">
                <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto text-green-500">
                  <ShieldCheck size={32} />
                </div>
                <h3 className="text-xl font-bold">Certificate Verified</h3>
                <p className="text-xs text-muted-foreground">
                  This credential has been officially verified by Make It Simple Academy records.
                </p>
              </div>

              <div className="space-y-3 bg-secondary/30 p-4 rounded-2xl border border-border text-xs mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Recipient:</span>
                  <span className="font-bold text-foreground">{user?.full_name || 'Student'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Certificate:</span>
                  <span className="font-bold text-foreground">{verifyingCert.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Program:</span>
                  <span className="font-bold text-foreground">{verifyingCert.programs?.name || 'Fullstack Bootcamp'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Credential ID:</span>
                  <span className="font-mono font-bold text-primary">{verifyingCert.credential_id || 'MIS-' + verifyingCert.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Issue Date:</span>
                  <span className="font-bold text-foreground">{verifyingCert.issued_at ? new Date(verifyingCert.issued_at).toLocaleDateString() : 'Active'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Issuer:</span>
                  <span className="font-bold text-foreground">Make It Simple Academy</span>
                </div>
              </div>

              <button
                onClick={() => setVerifyingCert(null)}
                className="w-full py-2.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors"
              >
                Close Verification
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
