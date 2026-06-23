import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, MoreVertical, Edit, Eye } from 'lucide-react';

export default function InstructorCoursesPage() {
  const [courses] = useState([
    { id: 1, title: 'React Fundamentals', cohort: 'Cohort A', students: 45, completion: 82, status: 'Active' },
    { id: 2, title: 'Advanced State Management', cohort: 'Cohort A', students: 45, completion: 45, status: 'Active' },
    { id: 3, title: 'UI/UX for Developers', cohort: 'Cohort B', students: 38, completion: 12, status: 'Draft' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage Courses</h1>
          <p className="text-muted-foreground">Create and manage your course materials and modules.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors">
          <Plus size={20} /> Create Course
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course, i) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-2xl border border-border overflow-hidden group"
          >
            <div className="h-32 bg-secondary/50 p-6 relative">
              <div className="absolute top-4 right-4 flex gap-2">
                <span className={`px-2 py-1 text-xs font-bold rounded-lg ${course.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                  {course.status}
                </span>
                <button className="p-1.5 bg-background/50 backdrop-blur-sm rounded-lg hover:bg-background transition-colors">
                  <MoreVertical size={16} />
                </button>
              </div>
              <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen size={24} />
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-bold mb-1">{course.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{course.cohort} • {course.students} Students Enrolled</p>
              
              <div className="space-y-1 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-muted-foreground">Avg. Completion</span>
                  <span className="font-bold">{course.completion}%</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${course.completion}%` }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center gap-2 py-2 bg-secondary/50 hover:bg-secondary rounded-xl text-sm font-medium transition-colors">
                  <Edit size={16} /> Edit
                </button>
                <button className="flex items-center justify-center gap-2 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-sm font-bold transition-colors">
                  <Eye size={16} /> View
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
