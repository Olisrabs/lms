import { motion } from 'framer-motion';
import { Search, PlayCircle, Clock, BookOpen, ChevronRight, Award } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { mockDb } from '../../lib/mockDb';

export default function StudentCoursesPage() {
  const [coursesData, setCoursesData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setCoursesData(mockDb.getCourses());
  }, []);

  const filteredCourses = coursesData.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    course.instructor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Courses</h1>
          <p className="text-muted-foreground">Continue learning and tracking your progress.</p>
        </div>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your courses..." 
            className="w-full bg-card/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all backdrop-blur-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`glass-card rounded-2xl overflow-hidden border border-border group ${course.status === 'locked' ? 'opacity-75 grayscale-[0.5]' : ''}`}
          >
            <div className={`h-40 ${course.thumbnail} p-6 relative flex flex-col justify-between`}>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
              {course.status === 'completed' && (
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-white/20">
                  <Award size={14} /> Completed
                </div>
              )}
              {course.status === 'locked' && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
                   <div className="bg-card text-foreground px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-xl">
                      🔒 Locked
                   </div>
                </div>
              )}
              <h3 className="text-xl font-bold text-white relative z-10 drop-shadow-md leading-tight mt-auto">{course.title}</h3>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-muted-foreground mb-4">Instructor: {course.instructor}</p>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-3">
                <div className="flex items-center gap-1"><BookOpen size={14}/> {course.modules} Modules</div>
                <div className="flex items-center gap-1"><PlayCircle size={14}/> {course.lessons} Lessons</div>
                <div className="flex items-center gap-1"><Clock size={14}/> ~12h</div>
              </div>

              <div className="space-y-1 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-foreground">{course.progress}% Completed</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${course.progress}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={`h-full rounded-full ${course.progress === 100 ? 'bg-green-500' : 'bg-primary'}`}
                  ></motion.div>
                </div>
              </div>

              {course.status === 'locked' ? (
                 <button 
                   disabled
                   className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all bg-secondary text-muted-foreground cursor-not-allowed"
                 >
                   Not Available Yet
                 </button>
              ) : (
                 <Link 
                   to={course.status === 'completed' ? `/student/courses/${course.id}` : `/student/courses/${course.id}/lesson/1`}
                   className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                     course.status === 'completed' 
                       ? 'bg-secondary text-foreground hover:bg-secondary/80' 
                       : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20'
                   }`}
                 >
                   {course.status === 'completed' ? 'Review Course' : 'Continue Learning'}
                   <ChevronRight size={16} />
                 </Link>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
