import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Menu, X, PlayCircle, Star, Clock
} from 'lucide-react';

export default function BootcampPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isPromoActive = () => {
    // Promo active for 2 weeks from July 11, 2026 (until July 25, 2026)
    const promoExpiry = new Date('2026-07-25T23:59:59+01:00');
    return new Date() <= promoExpiry;
  };

  const getTitleFontSize = (title: string) => {
    if (title.length > 25) return 'text-lg';
    if (title.length > 20) return 'text-xl';
    return 'text-2xl';
  };

  const bootcamps = [
    { title: 'Full-Stack Web Development', duration: '8 Weeks', students: '1.2k', price: '₦10,000', realPrice: '₦15,000', tag: 'Engineering', img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&q=80', rating: 4.9},
    { title: 'Graphics Design', duration: '5 Weeks', students: '2.1k', price: '₦7,000', realPrice: '₦10,000', tag: 'Design', img: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&q=80', rating: 5.0},
 ];

  return (
    <div className="min-h-screen bg-white text-[#1A1A2E] font-sans selection:bg-[#EF4444]/30 overflow-x-hidden">
      
      {/* 1. Header / Navbar */}
      <nav className="absolute top-0 w-full z-50 bg-[#F8F1F7]">
        <div className="container mx-auto px-6 md:px-12 lg:px-16 py-6 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logo.PNG" alt="Make It Simple" className="h-10" />
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-[#1A1A2E] font-medium">
            <Link to="/" className="hover:text-[#0047d6] transition-colors text-[#0047d6] font-bold">Home</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/signin" className="border-2 border-[#1A1A2E] bg-white text-[#1A1A2E] px-7 py-2.5 rounded-full font-bold hover:bg-gray-50 transition-colors">Sign In</Link>
            <Link to="/signup" className="bg-[#0047d6] text-white px-7 py-2.5 rounded-full font-bold shadow-lg shadow-[#0047d6]/20 hover:opacity-90 transition-opacity">Sign Up</Link>
          </div>

          <button className="md:hidden text-[#1A1A2E]" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t overflow-hidden shadow-lg"
            >
              <div className="flex flex-col px-6 py-4 gap-4 font-medium text-[#1A1A2E]">
                <Link to="/bootcamp" className="py-2 text-[#0047d6] font-bold">Bootcamp</Link>
                <hr className="border-gray-100" />
                <Link to="/signin" className="py-2 hover:text-[#0047d6]">Sign In</Link>
                <Link to="/signup" className="bg-[#0047d6] text-white text-center py-3 rounded-full font-bold">Sign Up</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="bg-[#F8F1F7] pt-40 pb-20 overflow-hidden relative">
        <div className="container mx-auto px-6 md:px-12 lg:px-16 text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#1A1A2E] leading-[1.15] mb-6 max-w-3xl mx-auto"
          >
            Accelerate your career with our Intensive <span className="bg-clip-text text-transparent bg-[#0047d6]">Bootcamps</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[#6E6E82] text-lg mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Master in-demand skills in weeks, not years. Join our immersive, instructor-led bootcamps and transform your professional trajectory.
          </motion.p>
        </div>
      </section>

      {/* Bootcamps Grid */}
      <section className="py-24 bg-white relative">
        <div className="container mx-auto px-6 md:px-12 lg:px-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl font-extrabold text-[#1A1A2E] mb-2">Available Bootcamps</h2>
              <p className="text-[#6E6E82]">Find the perfect program to achieve your goals.</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {bootcamps.map((course, idx) => (
              <div key={idx} className="bg-white rounded-[28px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-transform duration-300 border border-gray-100">
                <div className="relative h-56 mb-6 rounded-[20px] overflow-hidden group">
                  <img src={course.img} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-[#1A1A2E] text-xs font-extrabold px-4 py-2 rounded-full shadow-sm">
                    {course.tag}
                  </div>
                  <div className="absolute top-4 right-4 bg-white text-[#1A1A2E] text-xs font-extrabold px-3 py-2 rounded-full flex items-center gap-1.5 shadow-sm">
                    <Star size={14} className="text-[#EF4444]" fill="currentColor" /> {course.rating}
                  </div>
                </div>
                
                <div className="px-2 pb-2">
                  <div className="h-16 mb-5 flex items-center">
                    <h3 className={`${getTitleFontSize(course.title)} font-extrabold text-[#1A1A2E] line-clamp-2 leading-tight hover:text-[#0047d6] cursor-pointer transition-colors`}>
                      {course.title}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-6 mb-6">
                    <div className="flex items-center gap-2 text-[#6E6E82] font-medium">
                      <Clock size={18} className="text-[#0047d6]" /> {course.duration}
                    </div>
                  </div>
                  
                  <div className="h-px bg-gray-100 mb-5"></div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      {isPromoActive() ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-[#1A1A2E]">{course.price}</span>
                          <span className="text-lg font-medium text-[#6E6E82] line-through">{course.realPrice}</span>
                        </div>
                      ) : (
                        <span className="text-3xl font-black text-[#1A1A2E]">{course.realPrice}</span>
                      )}
                    </div>
                    <Link to="/signup" className="bg-[#1A1A2E] text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-[#0047d6] transition-colors">
                      Enroll
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A1A2E] pt-20 pb-10 text-white/60">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div>
              <img src="/logo.PNG" alt="Make It Simple" className="h-10 mb-6 brightness-0 invert" />
              <p className="leading-relaxed mb-6">
                Transforming the way you learn with expert-led courses and interactive bootcamps designed for your success.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#EF4444] hover:text-white transition-colors text-white">
                  <PlayCircle size={20} />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#EF4444] hover:text-white transition-colors text-white">
                  <Menu size={20} />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-bold text-lg mb-6">Company</h4>
              <ul className="space-y-4 font-medium">
                <li><Link to="/about" className="hover:text-[#EF4444] transition-colors">About Us</Link></li>
                <li><Link to="/bootcamp" className="hover:text-[#EF4444] transition-colors">Bootcamps</Link></li>
                <li><Link to="/instructors" className="hover:text-[#EF4444] transition-colors">Instructors</Link></li>
                <li><Link to="/contact" className="hover:text-[#EF4444] transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold text-lg mb-6">Support</h4>
              <ul className="space-y-4 font-medium">
                <li><Link to="/faq" className="hover:text-[#EF4444] transition-colors">FAQ</Link></li>
                <li><Link to="/help" className="hover:text-[#EF4444] transition-colors">Help Center</Link></li>
                <li><Link to="/terms" className="hover:text-[#EF4444] transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-[#EF4444] transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold text-lg mb-6">Newsletter</h4>
              <p className="mb-4 text-sm">Subscribe to get the latest updates and offers.</p>
              <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="bg-white/10 border border-white/20 rounded-full px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[#EF4444]"
                />
                <button className="bg-[#0047d6] text-white px-6 py-3 rounded-full font-bold shadow-lg hover:opacity-90 transition-opacity">
                  Subscribe
                </button>
              </form>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <p>© {new Date().getFullYear()} Make It Simple. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/cookies" className="hover:text-white transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
