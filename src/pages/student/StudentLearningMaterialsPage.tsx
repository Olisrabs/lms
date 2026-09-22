import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, FileText, Video, Link as LinkIcon, Download, ExternalLink, CheckCircle2 } from 'lucide-react';
import { materialsApi } from '../../lib/api';

interface ResourceItem {
  id?: string;
  title: string;
  type: string;
  size: string;
  url?: string;
  color: string;
}

const defaultResources: ResourceItem[] = [
  { title: 'React Hooks Deep Dive & Cheat Sheet', type: 'PDF', size: '2.4 MB', url: 'https://react.dev', color: 'text-red-500' },
  { title: 'Understanding the JavaScript Event Loop', type: 'Video', size: '14 mins', url: 'https://youtube.com', color: 'text-blue-500' },
  { title: 'Modern CSS Grid vs Flexbox Architecture', type: 'Slides', size: '5.1 MB', url: 'https://developer.mozilla.org', color: 'text-orange-500' },
  { title: 'MDN Web Docs: Array Methods & Prototypes', type: 'Link', size: 'External Link', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array', color: 'text-purple-500' },
  { title: 'Frontend Scalable System Design Guide', type: 'PDF', size: '8.2 MB', url: 'https://github.com', color: 'text-red-500' },
  { title: 'TypeScript 5 Complete Handbook & Reference', type: 'PDF', size: '4.7 MB', url: 'https://www.typescriptlang.org/docs/', color: 'text-blue-500' },
];

export default function StudentLearningMaterialsPage() {
  const [items, setItems] = useState<ResourceItem[]>(defaultResources);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  useEffect(() => {
    materialsApi.list().then((dbMats) => {
      if (dbMats && dbMats.length > 0) {
        const formatted: ResourceItem[] = dbMats.map((m: any) => ({
          id: m.id,
          title: m.title,
          type: m.file_type ? m.file_type.toUpperCase() : 'PDF',
          size: m.file_size ? `${Math.round(m.file_size / 1024)} KB` : '1.5 MB',
          url: m.file_url || 'https://example.com/sample.pdf',
          color: m.file_type === 'video' ? 'text-blue-500' : 'text-red-500',
        }));
        setItems([...formatted, ...defaultResources]);
      }
    }).catch(console.warn);
  }, []);

  const handleAction = (res: ResourceItem) => {
    if (res.type === 'Link' && res.url) {
      window.open(res.url, '_blank', 'noopener,noreferrer');
    } else {
      // Trigger file download
      const element = document.createElement('a');
      const fileText = `Make It Simple Academy Study Material\n\nTitle: ${res.title}\nCategory: ${res.type}\nResource URL: ${res.url || 'https://makeitsimple.edu'}\n\nDownloaded from Make It Simple Student Portal.`;
      const fileBlob = new Blob([fileText], { type: 'text/plain;charset=utf-8' });
      element.href = URL.createObjectURL(fileBlob);
      element.download = `${res.title.replace(/[^a-zA-Z0-9]/g, '_')}.${res.type.toLowerCase() === 'pdf' ? 'pdf' : 'txt'}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      setDownloadSuccess(res.title);
      setTimeout(() => setDownloadSuccess(null), 3000);
    }
  };

  const types = ['All', 'PDF', 'Video', 'Slides', 'Link'];

  const filtered = items.filter((res) => {
    const matchesSearch = res.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'All' || res.type.toUpperCase() === selectedType.toUpperCase();
    return matchesSearch && matchesType;
  });

  const getIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'VIDEO':
        return Video;
      case 'LINK':
        return LinkIcon;
      default:
        return FileText;
    }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {downloadSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl bg-green-500/15 border border-green-500/30 text-green-500 flex items-center gap-2 text-sm font-semibold backdrop-blur-md"
          >
            <CheckCircle2 size={18} />
            <span>Downloaded "{downloadSuccess}" successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Learning Materials</h1>
          <p className="text-muted-foreground mt-1">Access lecture notes, slides, cheat sheets, and study resources.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-colors cursor-pointer"
            >
              <Filter size={16} /> Filter: {selectedType}
            </button>

            <AnimatePresence>
              {filterDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setFilterDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                    className="absolute right-0 mt-2 w-36 bg-card border border-border rounded-xl shadow-xl z-40 overflow-hidden py-1"
                  >
                    {types.map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setSelectedType(t);
                          setFilterDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors hover:bg-secondary ${
                          selectedType === t ? 'text-primary bg-primary/10' : 'text-foreground'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
            <input 
              type="text" 
              placeholder="Search resources..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 bg-card/50 border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all backdrop-blur-xl"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground glass-card rounded-2xl border border-border">
            <FileText size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-base">No learning materials found</p>
            <p className="text-xs mt-1">Try adjusting your search query or filter criteria.</p>
          </div>
        ) : (
          filtered.map((res, i) => {
            const Icon = getIcon(res.type);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card p-5 rounded-2xl border border-border hover:shadow-lg hover:shadow-primary/5 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon size={24} className={res.color} />
                  </div>
                  <h3 className="font-bold text-base mb-1 line-clamp-2">{res.title}</h3>
                </div>

                <div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider bg-secondary px-2 py-1 rounded-md">
                      {res.type}
                    </span>
                    <span className="text-xs text-muted-foreground">{res.size}</span>
                  </div>

                  <button
                    onClick={() => handleAction(res)}
                    className="w-full mt-4 py-2 bg-primary/10 text-primary font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-colors cursor-pointer active:scale-95"
                  >
                    {res.type === 'Link' ? (
                      <>
                        <ExternalLink size={15} /> Open Link
                      </>
                    ) : (
                      <>
                        <Download size={15} /> Download
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
