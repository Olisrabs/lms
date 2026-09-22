import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play as PlayIcon, CheckCircle, Bookmark as BookmarkIcon, FileText as FileIcon, Download as DLIcon, ChevronLeft as LeftIcon, ChevronRight as RightIcon } from 'lucide-react';

export default function StudentLessonPage() {
  const [activeTab, setActiveTab] = useState('notes');
  const [isCompleted, setIsCompleted] = useState(false);
  const [searchMaterial, setSearchMaterial] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaved, setIsSaved] = useState(() => localStorage.getItem('lesson_saved_state') === 'true');

  const toggleSave = () => {
    const next = !isSaved;
    setIsSaved(next);
    if (next) localStorage.setItem('lesson_saved_state', 'true');
    else localStorage.removeItem('lesson_saved_state');
  };

  const handlePrevLesson = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextLesson = () => {
    setIsCompleted(true);
    localStorage.setItem('course_1_completed', 'true');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/student/courses/1" className="p-2 bg-secondary rounded-xl hover:bg-secondary/80 transition-colors">
          <LeftIcon size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">2.2 Passing Props</h1>
          <p className="text-sm text-muted-foreground">React.js & Hooks • Module 2</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player Placeholder */}
          <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden relative group shadow-xl">
            {/* Fake Video Player UI */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center pl-1 shadow-lg hover:scale-110 transition-transform cursor-pointer"
              >
                <PlayIcon size={32} fill="currentColor" />
              </button>
            </div>
            
            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-full h-1 bg-white/30 rounded-full mb-3 cursor-pointer">
                <div className="w-1/3 h-full bg-primary rounded-full relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow"></div>
                </div>
              </div>
              <div className="flex items-center justify-between text-white text-sm">
                <div className="flex items-center gap-4">
                  <button onClick={() => setIsPlaying(!isPlaying)} className="cursor-pointer">
                    <PlayIcon size={20} />
                  </button>
                  <span>{isPlaying ? 'Playing...' : '14:20 / 45:00'}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span>1x</span>
                  <span>HD</span>
                  <span>[  ]</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-border">
            <button 
              onClick={() => {
                const newStatus = !isCompleted;
                setIsCompleted(newStatus);
                if (newStatus) {
                  localStorage.setItem('course_1_completed', 'true');
                } else {
                  localStorage.removeItem('course_1_completed');
                }
              }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-colors cursor-pointer ${
                isCompleted 
                  ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              <CheckCircle size={20} />
              {isCompleted ? 'Completed' : 'Mark as Complete'}
            </button>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleSave}
                className={`p-2.5 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium cursor-pointer ${
                  isSaved ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                <BookmarkIcon size={18} className={isSaved ? 'fill-primary' : ''} /> {isSaved ? 'Saved' : 'Save'}
              </button>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrevLesson}
                  className="p-2.5 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-colors cursor-pointer" 
                  title="Previous lesson"
                >
                  <LeftIcon size={20} />
                </button>
                <button 
                  onClick={handleNextLesson}
                  className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-bold cursor-pointer"
                  title="Next lesson"
                >
                  Next <RightIcon size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Lesson Content Tabs */}
          <div className="glass-card rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center gap-6 border-b border-border px-6">
              {[
                { id: 'notes', label: 'Lesson Notes', icon: FileIcon },
                { id: 'resources', label: 'Resources (3)', icon: DLIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 font-semibold text-sm transition-colors flex items-center gap-2 border-b-2 ${
                    activeTab === tab.id 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'notes' && (
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <h3 className="text-xl font-bold mb-4">Passing Data with Props</h3>
                  <p className="text-muted-foreground mb-4">
                    React components use props to communicate with each other. Every parent component can pass some information to its child components by giving them props. Props might remind you of HTML attributes, but you can pass any JavaScript value through them, including objects, arrays, and functions.
                  </p>
                  <pre className="bg-secondary p-4 rounded-xl text-sm overflow-x-auto mb-4 border border-border">
                    <code>{`function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
const element = <Welcome name="Sara" />;
root.render(element);`}</code>
                  </pre>
                  <p className="text-muted-foreground">
                    Props are Read-Only. Whether you declare a component as a function or a class, it must never modify its own props.
                  </p>
                </div>
              )}
              {activeTab === 'resources' && (
                 <div className="space-y-4">
                   <div className="relative max-w-sm">
                     <FileIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                     <input
                       type="text"
                       placeholder="Search materials..."
                       value={searchMaterial}
                       onChange={(e) => setSearchMaterial(e.target.value)}
                       className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                     />
                   </div>
                   <div className="space-y-3">
                     {[
                       { name: 'React Cheatsheet.pdf', size: '2.4 MB' },
                       { name: 'Hooks_Deep_Dive.pptx', size: '5.1 MB' },
                       { name: 'Starter_Code.zip', size: '12 MB' },
                     ].filter(m => m.name.toLowerCase().includes(searchMaterial.toLowerCase())).map((res, i) => (
                       <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors border border-transparent hover:border-border cursor-pointer group">
                         <div className="flex items-center gap-3">
                           <FileIcon size={20} className="text-primary" />
                           <div>
                             <p className="text-sm font-medium">{res.name}</p>
                             <p className="text-xs text-muted-foreground">{res.size}</p>
                           </div>
                         </div>
                         <button className="p-2 bg-background rounded-lg text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                           <DLIcon size={18} />
                         </button>
                       </div>
                     ))}
                   </div>
                 </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Course Outline */}
        <div className="glass-card rounded-2xl border border-border p-4 h-fit sticky top-24">
          <h3 className="font-bold mb-4 px-2 text-lg">Course Contents</h3>
          
          <div className="space-y-2">
            {[
              { title: '1. Introduction to React', duration: '2h 15m', completed: true },
              { title: '2. Components & Props', duration: '3h 45m', completed: false, active: true },
              { title: '3. State & Lifecycle', duration: '4h 30m', completed: false },
            ].map((module, i) => (
              <div key={i} className="border border-border rounded-xl overflow-hidden bg-secondary/20">
                <div className="p-3 bg-secondary/50 font-bold text-sm flex items-center justify-between cursor-pointer">
                  <span>{module.title}</span>
                  {module.completed && <CheckCircle size={16} className="text-green-500" />}
                </div>
                {module.active && (
                  <div className="p-2 space-y-1 bg-background/50">
                    <Link to="#" className="flex items-center justify-between p-2 rounded-lg text-sm bg-green-500/10 text-green-600 dark:text-green-400">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} /> 2.1 Functional Components
                      </div>
                      <span className="text-xs">45m</span>
                    </Link>
                    <Link to="#" className="flex items-center justify-between p-2 rounded-lg text-sm bg-primary/10 text-primary font-bold border border-primary/20 shadow-sm">
                      <div className="flex items-center gap-2">
                        <PlayIcon size={14} fill="currentColor" /> 2.2 Passing Props
                      </div>
                      <span className="text-xs">1h</span>
                    </Link>
                    <Link to="#" className="flex items-center justify-between p-2 rounded-lg text-sm hover:bg-secondary text-muted-foreground transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground"></div> 2.3 Component Composition
                      </div>
                      <span className="text-xs">2h</span>
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
