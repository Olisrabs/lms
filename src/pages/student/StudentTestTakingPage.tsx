import { motion } from 'framer-motion';
import { useState } from 'react';
import { ArrowLeft, Clock, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

const testQuestions = [
  { id: 1, text: 'What is a functional component?', type: 'textarea' },
  { id: 2, text: 'Explain the Virtual DOM in simple terms.', type: 'textarea' },
  { id: 3, text: 'How do you pass data from parent to child?', type: 'textarea' }
];

export default function StudentTestTakingPage() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-4"
        >
          <CheckCircle2 size={40} />
        </motion.div>
        <h2 className="text-3xl font-bold">Test Completed Successfully!</h2>
        <p className="text-muted-foreground max-w-md text-center">Your answers have been submitted. You can check the status on the tests page.</p>
        <button 
          onClick={() => navigate('/student/tests')}
          className="mt-6 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors"
        >
          Return to Tests
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <Link to="/student/tests" className="p-2 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">React Assessment Test</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock size={14}/> 45 Mins Remaining</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {testQuestions.map((q, i) => (
          <motion.div 
            key={q.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 rounded-2xl"
          >
            <h3 className="text-lg font-semibold mb-4">Question {i + 1}</h3>
            <p className="mb-4 text-foreground">{q.text}</p>
            <textarea 
              rows={4}
              value={answers[q.id] || ''}
              onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
              placeholder="Type your answer here..."
              className="w-full bg-secondary/30 border border-border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              required
            ></textarea>
          </motion.div>
        ))}

        <div className="flex justify-end pt-6 border-t border-border">
          <button 
            type="submit"
            className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
          >
            Submit Test
          </button>
        </div>
      </form>
    </div>
  );
}


