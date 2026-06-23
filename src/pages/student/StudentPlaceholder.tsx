import { motion } from 'framer-motion';

export default function StudentPlaceholder({ title }: { title: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl p-8 border border-border min-h-[60vh] flex flex-col items-center justify-center text-center"
    >
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <span className="text-3xl text-primary">🚧</span>
      </div>
      <h1 className="text-3xl font-bold mb-4">{title}</h1>
      <p className="text-muted-foreground max-w-md mx-auto">
        This section is currently under construction. Please check back later for updates.
      </p>
    </motion.div>
  );
}
