import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Code, Palette, HeartPulse, Megaphone, 
  Camera, BookOpen, PenTool, Briefcase, Star,
  Menu, X
} from 'lucide-react';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const categories = [
    { name: 'Development', icon: Code },
    { name: 'Graphic Design', icon: Palette },
    { name: 'Health Fitness', icon: HeartPulse },
    { name: 'Digital Marketing', icon: Megaphone },
    { name: 'Photography', icon: Camera },
    { name: 'Teaching', icon: BookOpen },
    { name: 'Painting', icon: PenTool },
    { name: 'Business', icon: Briefcase },
  ];

  const courses = [
    { title: 'Complete Python Bootcamp: Go from zero to hero', rating: 4.5, price: '$129', reviews: '(1,234)', img: 'https://images.unsplash.com/photo-1526379095098-d400fd0bfce8?w=500&q=80' },
    { title: 'The Complete Financial Analyst Course 2024', rating: 4.8, price: '$199', reviews: '(892)', img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&q=80' },
    { title: 'AWS Certified Solutions Architect - 2024', rating: 4.7, price: '$149', reviews: '(2,104)', img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&q=80' },
    { title: 'Complete Python Bootcamp: Go from zero to hero', rating: 4.5, price: '$129', reviews: '(3,412)', img: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=500&q=80' },
    { title: 'Life Coaching Certificate Course', rating: 4.9, price: '$109', reviews: '(456)', img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&q=80' },
    { title: 'The Complete Video Production Bootcamp', rating: 4.6, price: '$159', reviews: '(1,876)', img: 'https://images.unsplash.com/photo-1574717024453-354056a3df3c?w=500&q=80' },
  ];

  const mentors = [
    { name: 'Sebastian Alen', role: 'Founder', img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80' },
    { name: 'Alex Portillo', role: 'Founder', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80' },
    { name: 'Emy Salmone', role: 'Founder', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80' },
    { name: 'Wes Bos', role: 'Code Reviewer', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80' },
  ];

  const testimonials = [
    { name: 'Jesse Hays', role: 'UI/UX Designer', text: '"I believe in lifelong learning and EduLe is a great place to learn from experts. I\'ve learned a lot and recommend it to all my friends."', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80' },
    { name: 'Gerald Leary', role: 'UI/UX Designer', text: '"I work in project management and joined EduLe because I get great courses for less. The instructors are fantastic, interesting, and helpful. I plan to use it for a long time!"', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80' },
    { name: 'Kenneth Leli', role: 'UI/UX Designer', text: '"I work in project management and joined EduLe because I get great courses for less. The instructors are fantastic, interesting, and helpful. I plan to use it for a long time!"', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80' },
    { name: 'Honce Learell', role: 'UI/UX Designer', text: '"I believe in lifelong learning and EduLe is a great place to learn from experts. I\'ve learned a lot and recommend it to all my friends."', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80' },
  ];

  return (
    <div className="min-h-screen bg-[#eff6ff] text-[#1f2937] font-sans overflow-x-hidden selection:bg-[#2563EB] selection:text-white">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-2">
          <BookOpen size={32} className="text-[#2563EB]" />
          <Link to="/" className="text-2xl font-extrabold tracking-tight text-[#1f2937]">EduLe</Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-700">
          <Link to="/" className="hover:text-[#2563EB] transition-colors">Bootcamps</Link>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/signin" className="text-sm font-bold text-gray-700 hover:text-[#2563EB] transition-colors">Sign In</Link>
          <Link to="/signup" className="border-2 border-gray-200 bg-white text-gray-800 px-6 py-2 rounded-xl hover:border-[#2563EB] hover:text-[#2563EB] transition-all font-bold shadow-sm">Sign Up</Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 right-0 bg-white shadow-xl border-t border-gray-100 p-6 flex flex-col gap-4 md:hidden z-50"
            >
              <Link to="/" className="font-medium text-gray-700 hover:text-[#2563EB]">Home</Link>
              <Link to="/" className="font-medium text-gray-700 hover:text-[#2563EB]">All Course</Link>
              <Link to="/" className="font-medium text-gray-700 hover:text-[#2563EB]">Pages</Link>
              <Link to="/" className="font-medium text-gray-700 hover:text-[#2563EB]">Blog</Link>
              <Link to="/" className="font-medium text-gray-700 hover:text-[#2563EB]">Contact</Link>
              <Link to="/signin" className="font-medium text-gray-700 hover:text-[#2563EB]">Sign In</Link>
              <Link to="/signup" className="border-2 border-gray-200 text-center px-6 py-2 rounded-xl font-bold hover:border-[#2563EB] hover:text-[#2563EB]">Sign Up</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-12 pb-24 flex flex-col lg:flex-row items-center gap-16 relative">
        {/* Left Content */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:w-1/2 relative z-10"
        >
          {/* Decorative Dashes */}
          <div className="absolute -top-12 -left-8 grid grid-cols-3 gap-3 opacity-60 pointer-events-none w-20">
            {[...Array(9)].map((_, i) => (
              <div key={i} className={`w-3 h-1 rounded-full bg-blue-400 transform ${i%2===0 ? 'rotate-12' : '-rotate-12'}`}></div>
            ))}
          </div>

          <p className="text-[#2563EB] font-bold text-sm sm:text-base mb-4 tracking-wide">
            Start your favourite course
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.15] mb-6 text-[#1f2937]">
            Now learning from<br/>anywhere, and build<br/>your <span className="text-[#2563EB] relative whitespace-nowrap">
              bright career.
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 9.5C45.5 3.5 110 1.5 198 9.5" stroke="#2563EB" strokeWidth="3" strokeLinecap="round"/>
                <path d="M15 11.5C50 7.5 100 6.5 180 11.5" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
              </svg>
            </span>
          </h1>
          <p className="text-gray-500 text-base sm:text-lg mb-10 max-w-lg leading-relaxed">
            It has survived not only five centuries but also the leap into electronic typesetting.
          </p>
          <button className="bg-[#2563EB] text-white px-8 py-3.5 rounded-lg font-bold text-sm tracking-wide hover:bg-[#1D4ED8] transition-colors shadow-lg shadow-[#2563EB]/30">
            Start A Course
          </button>
        </motion.div>

        {/* Right Image Content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:w-1/2 relative"
        >
          <div className="relative w-full max-w-[500px] mx-auto h-[550px] flex items-end justify-center">
            {/* Main Student Image */}
            <img 
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop" 
              alt="Student" 
              className="absolute bottom-0 w-[90%] h-full object-cover object-top z-10"
              style={{ maskImage: 'linear-gradient(to top, transparent 0%, black 15%)', WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 15%)' }}
            />
            
            {/* Floating Badge 1 */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, type: 'spring' }}
              className="absolute top-1/4 -left-8 z-20 flex flex-col items-center"
            >
              <div className="w-24 h-24 bg-[#2563EB] rounded-full flex flex-col items-center justify-center text-white shadow-xl shadow-[#2563EB]/30">
                <BookOpen size={24} className="mb-1" />
                <span className="font-bold text-xl leading-none">1,235</span>
                <span className="text-[10px] font-medium">courses</span>
              </div>
              <svg className="w-16 mt-2" viewBox="0 0 100 20" fill="none">
                <path d="M5 15Q50 5 95 15" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
                <path d="M15 19Q50 11 85 19" stroke="#2563EB" strokeWidth="1" strokeLinecap="round"/>
              </svg>
            </motion.div>

            {/* Floating Badge 2 */}
            <motion.div 
              initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.7, type: 'spring' }}
              className="absolute top-12 -right-4 z-20"
            >
              <div className="bg-white rounded-full w-28 h-28 flex flex-col items-center justify-center shadow-2xl border border-gray-50">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-3xl text-[#1f2937]">4.8</span>
                  <Star size={18} className="fill-[#2563EB] text-[#2563EB]" />
                </div>
                <span className="text-[10px] text-gray-500 font-medium">Rating (86K)</span>
              </div>
            </motion.div>

            {/* Decorative Arrows */}
            <svg className="absolute top-1/3 right-10 w-12 z-0 opacity-60" viewBox="0 0 50 50" fill="none">
              <path d="M45 5C45 5 25 10 5 25" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round"/>
              <path d="M5 25L15 15M5 25L15 35" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            
            <svg className="absolute bottom-1/3 -right-12 w-16 z-0 opacity-60" viewBox="0 0 50 100" fill="none">
              <path d="M5 95C25 75 45 45 25 5" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round"/>
              <path d="M25 5L15 15M25 5L35 15" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </motion.div>
      </section>

      {/* Popular Categories */}
      <section className="bg-blue-50/50 py-24 relative">
        <div className="absolute top-10 right-[10%] w-20 h-20 bg-[#3B82F6]/10 rounded-full"></div>
        <div className="absolute bottom-20 left-[5%] w-32 h-32 bg-[#3B82F6]/5 rounded-full"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Popular Categories</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Explore our highly sought-after categories designed to build your expertise.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {categories.map((category, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col items-center justify-center text-center group cursor-pointer"
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-[#2563EB] transition-colors">
                  <category.icon size={28} className="text-[#2563EB] group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-sm text-[#2D3142]">{category.name}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Courses */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Popular Courses</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Join thousands of students learning modern, high-demand skills.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {courses.map((course, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -10 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col"
              >
                <div className="h-56 overflow-hidden">
                  <img src={course.img} alt={course.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-bold text-[#1f2937] mb-6 leading-snug line-clamp-2 flex-1 hover:text-[#2563EB] cursor-pointer transition-colors">
                    {course.title}
                  </h3>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                    <div className="flex items-center gap-1 text-sm font-bold text-[#2563EB]">
                      <Star size={14} fill="currentColor" /> {course.rating}
                      <span className="text-gray-400 font-normal ml-1 text-xs">{course.reviews}</span>
                    </div>
                    <span className="font-bold text-lg text-[#1f2937]">{course.price}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Talented Mentors */}
      <section className="bg-blue-50/50 py-24 relative overflow-hidden">
        {/* Decorative dots background */}
        <div className="absolute left-10 top-1/2 -translate-y-1/2 w-24 h-24 grid grid-cols-4 gap-2 opacity-20">
          {[...Array(16)].map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></div>)}
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Top Talented Mentors</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Learn directly from industry leaders and experienced practitioners.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {mentors.map((mentor, idx) => (
              <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center flex flex-col items-center">
                <div className="w-full aspect-square rounded-xl overflow-hidden mb-4 bg-gray-100">
                  <img src={mentor.img} alt={mentor.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-bold text-[#1f2937]">{mentor.name}</h3>
                <p className="text-gray-400 text-xs mt-1">{mentor.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Student's Say */}
      <section className="py-24 relative bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">What Student's Say</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Don't just take our word for it. Read what our successful graduates say.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {testimonials.map((test, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <img src={test.img} alt={test.name} className="w-12 h-12 rounded-full object-cover" />
                    <div>
                      <h4 className="font-bold text-sm text-[#1f2937]">{test.name}</h4>
                      <p className="text-gray-400 text-xs">{test.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 text-[#2563EB]">
                    {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                  </div>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed italic">
                  {test.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#eff6ff] pt-16 pb-8 border-t border-blue-100">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen size={28} className="text-[#2563EB]" />
                <h3 className="font-extrabold text-xl text-[#1f2937]">EduLe</h3>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-[#1f2937] mb-6">My Account</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li><Link to="/" className="hover:text-[#2563EB] transition-colors">Term & Condition</Link></li>
                <li><Link to="/" className="hover:text-[#2563EB] transition-colors">Privacy and Policy</Link></li>
                <li><Link to="/" className="hover:text-[#2563EB] transition-colors">Instructor</Link></li>
                <li><Link to="/" className="hover:text-[#2563EB] transition-colors">Account</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-[#1f2937] mb-6">Top Link</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li><Link to="/" className="hover:text-[#2563EB] transition-colors">About</Link></li>
                <li><Link to="/" className="hover:text-[#2563EB] transition-colors">Service</Link></li>
                <li><Link to="/" className="hover:text-[#2563EB] transition-colors">Contact</Link></li>
                <li><Link to="/" className="hover:text-[#2563EB] transition-colors">Blog</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-[#1f2937] mb-6">Sitemap</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li><Link to="/" className="hover:text-[#2563EB] transition-colors">Help & Center</Link></li>
                <li><Link to="/" className="hover:text-[#2563EB] transition-colors">Development</Link></li>
                <li><Link to="/" className="hover:text-[#2563EB] transition-colors">Design</Link></li>
                <li><Link to="/" className="hover:text-[#2563EB] transition-colors">Categories</Link></li>
              </ul>
            </div>

            <div className="col-span-2 lg:col-span-1 flex items-end justify-center lg:justify-end">
              {/* Footer illustration placeholder */}
              <div className="relative w-48 h-32 flex items-end justify-center">
                <div className="absolute bottom-0 w-32 h-16 bg-[#2563EB] rounded-t-full opacity-10"></div>
                <BookOpen size={48} className="text-[#2563EB] relative z-10 mb-4" />
              </div>
            </div>
          </div>
          
          <div className="text-center text-sm text-gray-400 pt-8 border-t border-blue-100">
            © 2024 EduLe. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
