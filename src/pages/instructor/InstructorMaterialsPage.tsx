import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, FileText, Download, FileArchive, Image as ImageIcon, Trash2, X, ExternalLink, Loader2 } from 'lucide-react';
import { materialsApi, programsApi } from '../../lib/api';

export default function InstructorMaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('document');
  const [selectedCohortId, setSelectedCohortId] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const data = await materialsApi.list() as any[];
      setMaterials(data || []);
    } catch (err) {
      console.error('Failed to fetch materials:', err);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
    programsApi.listAllCohorts().then((res: any) => {
      const list = res || [];
      setCohorts(list);
      if (list.length > 0) setSelectedCohortId(list[0].id);
    }).catch(console.error);
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setError(null);
    setUploading(true);

    try {
      if (file) {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('file_type', fileType);
        if (selectedCohortId) formData.append('cohort_id', selectedCohortId);
        formData.append('file', file);
        await materialsApi.upload(formData);
      } else {
        await materialsApi.upload({
          title,
          description,
          file_url: fileUrl,
          file_type: fileType,
          cohort_id: selectedCohortId || undefined,
        });
      }

      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setFileUrl('');
      setFile(null);
      await fetchMaterials();
    } catch (err: any) {
      setError(err?.error || err?.message || 'Failed to upload material');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this learning material?')) return;
    try {
      await materialsApi.delete(id);
      setMaterials(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('Failed to delete material:', err);
    }
  };

  const getIcon = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('pdf') || t.includes('doc')) return <FileText size={20} className="text-blue-500" />;
    if (t.includes('zip') || t.includes('rar') || t.includes('archive')) return <FileArchive size={20} className="text-orange-500" />;
    if (t.includes('image') || t.includes('png') || t.includes('jpg')) return <ImageIcon size={20} className="text-green-500" />;
    return <FileText size={20} className="text-primary" />;
  };

  const filtered = materials.filter(m => {
    const matchesSearch = (m.title || '').toLowerCase().includes(search.toLowerCase()) ||
                          (m.description || '').toLowerCase().includes(search.toLowerCase());
    if (typeFilter === 'All') return matchesSearch;
    return matchesSearch && (m.file_type || m.content_type || '').toLowerCase().includes(typeFilter.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Learning Materials</h1>
          <p className="text-muted-foreground">Upload and manage learning resources for your students.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <Plus size={20} /> Upload Material
        </button>
      </div>

      <div className="glass-card rounded-2xl border border-border p-4 flex gap-4 overflow-x-auto text-sm font-medium">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Search materials..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="bg-secondary/50 border border-border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="All">All Types</option>
          <option value="document">Documents (PDF, DOCX)</option>
          <option value="archive">Archives (ZIP, RAR)</option>
          <option value="image">Images (PNG, JPG)</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground animate-pulse">Loading materials from database...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl border border-border py-16 text-center text-muted-foreground">
          <FileText size={48} className="mx-auto mb-3 opacity-20" />
          <p className="font-semibold text-lg">No learning materials uploaded yet</p>
          <p className="text-sm mt-1">Click 'Upload Material' above to add resources for your program.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((mat, i) => (
            <motion.div
              key={mat.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-2xl border border-border p-5 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    {getIcon(mat.file_type || mat.content_type)}
                  </div>
                  <button
                    onClick={() => handleDelete(mat.id)}
                    className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete Material"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <h3 className="font-bold text-base mb-1 group-hover:text-primary transition-colors line-clamp-2">{mat.title}</h3>
                {mat.description && (
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{mat.description}</p>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-border mt-2">
                <span className="text-xs font-medium text-muted-foreground uppercase">{mat.file_type || 'document'}</span>
                {mat.file_url ? (
                  <a
                    href={mat.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md hover:bg-primary/20 transition-colors"
                  >
                    <ExternalLink size={12} /> Open Material
                  </a>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-md">
                    <Download size={12} /> Resource
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold">Upload Learning Material</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm p-3 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Module 1 Study Guide"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of the resource..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Target Cohort</label>
                <select
                  value={selectedCohortId}
                  onChange={e => setSelectedCohortId(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value="">All Cohorts / Global</option>
                  {cohorts.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Material Type</label>
                  <select
                    value={fileType}
                    onChange={e => setFileType(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="document">Document (PDF/DOC)</option>
                    <option value="archive">Archive (ZIP/RAR)</option>
                    <option value="image">Image (PNG/JPG)</option>
                    <option value="link">External Link</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">File Attachment</label>
                  <input
                    type="file"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-muted-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Resource Link / URL (if not uploading file)</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={fileUrl}
                  onChange={e => setFileUrl(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {uploading ? 'Uploading...' : 'Submit to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
