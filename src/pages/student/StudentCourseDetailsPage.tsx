import { motion } from 'framer-motion';
import { PlayCircle, Clock, BookOpen, Download, MessageSquare, CheckCircle2, ChevronRight, FileText } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const course = {
  title: 'React.js & Hooks',
  instructor: 'Dan Abramov',
  progress: 30,
  modules: [
    {
      id: 1,
      title: 'Introduction to React',
      duration: '2h 15m',
      completed: true,
      lessons: [
        { id: 101, title: 'What is React?', duration: '15m', completed: true },
        { id: 102, title: 'Virtual DOM Explained', duration: '20m', completed: true },
        { id: 103, title: 'Your First React App', duration: '1h 40m', completed: true },
      ]
    },
    {
      id: 2,
      title: 'Components & Props',
      duration: '3h 45m',
      completed: false,
      lessons: [
        { id: 201, title: 'Functional Components', duration: '45m', completed: true },
        { id: 202, title: 'Passing Props', duration: '1h', completed: false },
        { id: 203, title: 'Component Composition', duration: '2h', completed: false },
      ]
    },
    {
      id: 3,
      title: 'State & Lifecycle',
      duration: '4h 30m',
      completed: false,
      lessons: [
        { id: 301, title: 'Understanding State', duration: '1h', completed: false },
        { id: 302, title: 'Handling Events', duration: '1h 30m', completed: false },
        { id: 303, title: 'Lifecycle Methods', duration: '2h', completed: false },
      ]
    }
  ]
};

export default function StudentCourseDetailsPage() {
  const [activeTab, setActiveTab] = useState('modules');

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-border relative overflow-hidden bg-gradient-to-br from-cyan-500/10 to-primary/10">
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-sm mb-3">
              <span className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">Frontend Engineering</span>
              <span>•</span>
              <span>Intermediate</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">{course.title}</h1>
            <p className="text-muted-foreground mb-6 max-w-2xl">
              Master modern React from the ground up. Learn about components, props, state, and advanced hooks to build scalable web applications.
            </p>
            
            <div className="flex flex-wrap items-center gap-6 text-sm font-medium">
              <div className="flex items-center gap-2"><BookOpen size={16} className="text-primary"/> 6 Modules</div>
              <div className="flex items-center gap-2"><PlayCircle size={16} className="text-primary"/> 30 Lessons</div>
              <div className="flex items-center gap-2"><Clock size={16} className="text-primary"/> 18h Total</div>
            </div>
          </div>
          
          <div className="w-full md:w-auto shrink-0 bg-card/80 backdrop-blur-xl p-6 rounded-2xl border border-border shadow-xl">
            <p className="text-sm text-muted-foreground mb-2">Course Progress</p>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-4xl font-bold">{course.progress}%</span>
            </div>
            <div className="w-full sm:w-48 bg-secondary rounded-full h-2 mb-6">
              <div className="bg-primary h-2 rounded-full" style={{ width: `${course.progress}%` }}></div>
            </div>
            <Link to={`/student/courses/1/lesson/202`} className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 px-6 rounded-xl font-bold hover:bg-primary/90 transition-colors">
              <PlayCircle size={20} /> Continue Learning
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto custom-scrollbar">
        {['Modules', 'Resources'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase())}
            className={`px-6 py-3 font-semibold text-sm transition-colors whitespace-nowrap border-b-2 ${
              activeTab === tab.toLowerCase() 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {activeTab === 'modules' && course.modules.map((module, mIndex) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: mIndex * 0.1 }}
              className="glass-card rounded-2xl border border-border overflow-hidden"
            >
              <div className="p-4 sm:p-6 bg-secondary/30 flex items-center justify-between border-b border-border">
                <div>
                  <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                    Module {module.id}: {module.title}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-4">
                    <span>{module.lessons.length} Lessons</span>
                    <span>{module.duration}</span>
                  </p>
                </div>
                {module.completed && (
                  <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                    <CheckCircle2 size={20} />
                  </div>
                )}
              </div>
              
              <div className="divide-y divide-border/50">
                {module.lessons.map((lesson, lIndex) => (
                  <div key={lesson.id} className="p-4 hover:bg-secondary/20 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      {lesson.completed ? (
                        <CheckCircle2 size={20} className="text-green-500 shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground group-hover:border-primary transition-colors shrink-0"></div>
                      )}
                      <div>
                        <p className={`font-medium ${lesson.completed ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {mIndex + 1}.{lIndex + 1} {lesson.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><PlayCircle size={12}/> Video</span>
                          <span>{lesson.duration}</span>
                        </div>
                      </div>
                    </div>
                    <Link to={`/student/courses/1/lesson/${lesson.id}`} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={20} />
                    </Link>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          {activeTab !== 'modules' && (
            <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground">
              Content for {activeTab} will be displayed here.
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-border">
            <h3 className="font-bold text-lg mb-4">Instructor</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                DA
              </div>
              <div>
                <p className="font-bold">Dan Abramov</p>
                <p className="text-sm text-muted-foreground">Senior Software Engineer</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Co-author of Redux and Create React App. Dedicated to making React simpler and more accessible.
            </p>
            <button className="w-full py-2 bg-secondary text-foreground rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors">
              <MessageSquare size={16} /> Contact Instructor
            </button>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-border">
            <h3 className="font-bold text-lg mb-4">Module Resources</h3>
            <div className="space-y-3">
              {[
                { name: 'React Cheatsheet.pdf', size: '2.4 MB' },
                { name: 'Hooks_Deep_Dive.pptx', size: '5.1 MB' },
                { name: 'Starter_Code.zip', size: '12 MB' },
              ].map((res, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors border border-transparent hover:border-border cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-primary" />
                    <div>
                      <p className="text-sm font-medium">{res.name}</p>
                      <p className="text-xs text-muted-foreground">{res.size}</p>
                    </div>
                  </div>
                  <Download size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
