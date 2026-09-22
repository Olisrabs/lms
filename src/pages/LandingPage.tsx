import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Play, Star, Users, BookOpen, Clock,
  GraduationCap, Menu, X, CheckCircle2,
} from 'lucide-react';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSubscribed(true);
    setNewsletterEmail('');
  };

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

  const courses = [
    { title: 'Graphics Design Masterclass', rating: 5.0, classes: 32, students: '4.1k', price: '$680.00', instructor: 'Emily Chen', tag: 'Design', img: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&q=80', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80' },
    { title: 'Web Design & Development', rating: 5.0, classes: 24, students: '2.5k', price: '$560.00', instructor: 'Jane Doe', tag: 'Web Design', img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&q=80', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80' },
  ];

  const testimonials = [
    { name: 'Sarah Jenkins', role: 'UI/UX Designer', text: '"I believe in lifelong learning and Make It Simple is a great place to learn from experts. I\'ve learned a lot and recommend it to all my friends."', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80' },
    { name: 'Michael Ross', role: 'Frontend Developer', text: '"The courses are well-structured and the instructors are fantastic. I was able to land my dream job after completing the Web Development bootcamp."', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80' },
    { name: 'Emily Chen', role: 'Product Manager', text: '"Make It Simple offers a unique learning experience. The flexibility and the quality of the content are unmatched. Highly recommended for professionals."', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80' },
  ];

  const benefits = [
    { title: 'Online Degrees', desc: 'Earn accredited degrees from the comfort of your home.', icon: GraduationCap },
    { title: 'Short Courses', desc: 'Enhance your skills with focused, short-term courses.', icon: Clock },
    { title: 'Training From Experts', desc: 'Learn directly from industry leaders and professionals.', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-white text-[#1A1A2E] font-sans selection:bg-[#EF4444]/30 overflow-x-hidden">

      {/* 1. Header / Navbar */}
      <nav className="absolute top-0 w-full z-50 bg-[#F8F1F7]">
        <div className="container mx-auto px-6 md:px-10 lg:px-16 py-6 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logo.PNG" alt="Make It Simple" className="h-10" />
          </Link>

          <div className="hidden md:flex items-center gap-8 text-[#1A1A2E] font-medium">
            <Link to="/bootcamp" className="hover:text-[#0047d6] transition-colors">Bootcamp</Link>
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
              className="md:hidden bg-white border-t overflow-hidden"
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

      {/* 2. Hero Section */}
      <section className="bg-[#F8F1F7] pt-40 pb-20 overflow-hidden min-h-[90vh] flex items-center">
        <div className="container mx-auto px-6 md:px-12 lg:px-16 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="lg:w-[55%] z-10 text-center lg:text-left"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#1A1A2E] leading-[1.15] mb-6">
              Develop your skills in a new and unique way
            </h1>
            <p className="text-[#6E6E82] text-lg mb-10 max-w-[420px] leading-relaxed mx-auto lg:mx-0">
              Explore a transformative approach to skill building. Make It Simple offers interactive, expert-led courses designed for your success.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start">
              <Link to="/signup" className="bg-[#0047d6] text-white px-9 py-4 rounded-full font-bold shadow-[0_10px_30px_rgba(0,71,214,0.3)] hover:-translate-y-1 transition-transform w-full sm:w-auto text-center">
                Enroll Now
              </Link>
              <button
                type="button"
                onClick={() => {
                  document.getElementById('benefits-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center gap-3 text-[#1A1A2E] font-bold hover:text-[#0047d6] transition-colors group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full border-2 border-[#0047d6] flex items-center justify-center group-hover:bg-[#0047d6]/10 transition-colors">
                  <Play size={20} className="text-[#0047d6] ml-1" fill="currentColor" />
                </div>
                What's Make It Simple?
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:w-[45%] relative mt-10 lg:mt-0"
          >
            <div className="relative w-full max-w-[450px] aspect-square mx-auto">
              <div className="absolute inset-[-6%] border-2 border-dashed border-[#0047d6]/60 rounded-full animate-[spin_40s_linear_infinite]"></div>

              <div className="absolute inset-[6%] bg-[#0047d6] rounded-t-full rounded-b-[40px] overflow-hidden shadow-2xl">
                <img src="/man.webp" alt="Student" className="w-full h-full object-cover object-top mix-blend-luminosity opacity-80" />
              </div>

              {/* Floating Badges */}
              <motion.div
                animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-4 -left-4 md:-left-12 bg-white p-3 pr-5 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.08)] flex items-center gap-3 z-20"
              >
                <div className="w-10 h-10 rounded-full bg-[#0047d6] flex items-center justify-center text-white shrink-0">
                  <BookOpen size={18} />
                </div>
                <span className="font-bold text-[#1A1A2E] text-sm whitespace-nowrap">Online Courses</span>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-1/3 -right-4 md:-right-16 bg-white p-3 pr-5 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.08)] flex items-center gap-3 z-20"
              >
                <div className="flex -space-x-3 shrink-0">
                  <img src="https://www.lummi.ai/api/render/image/505110f4-5d62-4a9e-9ab8-49c78bc7d002?token=eyJhbGciOiJIUzI1NiJ9.eyJpZHMiOlsiNTA1MTEwZjQtNWQ2Mi00YTllLTlhYjgtNDljNzhiYzdkMDAyIl0sInJlc29sdXRpb24iOiJtZWRpdW0iLCJyZW5kZXJTcGVjcyI6eyJlZmZlY3RzIjp7InJlZnJhbWUiOnt9fX0sInNob3VsZEF1dG9Eb3dubG9hZCI6ZmFsc2UsImp0aSI6ImEycDJzcGVqZEM1dG9GRGdoelZ6dSIsImlhdCI6MTc4Mzc2MTQ1MywiZXhwIjoxNzgzNzYxNTEzfQ.kDG9vvmTm4YziU8pTJqLV1gthTynqMaSsNop1OelmQc" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                  <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                </div>
                <span className="font-bold text-[#1A1A2E] text-sm whitespace-nowrap">20+ Students</span>
              </motion.div>

            </div>
          </motion.div>
        </div>
      </section>

      {/* 5. Benefits Section */}
      <section id="benefits-section" className="bg-[#F8F1F7] py-24 overflow-hidden">
        <div className="container mx-auto px-6 md:px-12 lg:px-16 flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          <div className="lg:w-1/2 relative">
            <div className="relative w-full max-w-[500px] aspect-square mx-auto">
              <div className="absolute inset-[-8%] border-2 border-dashed border-[#0047d6]/50 rounded-full animate-[spin_50s_linear_infinite_reverse]"></div>

              <div className="grid grid-cols-2 grid-rows-2 gap-4 w-full h-full p-4 relative z-10">
                <img src="/workspace.webp" className="w-full h-full object-cover rounded-tl-full rounded-tr-3xl rounded-bl-3xl rounded-br-3xl shadow-lg" />
                <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80" className="w-full h-full object-cover rounded-tl-3xl rounded-tr-full rounded-bl-3xl rounded-br-3xl shadow-lg" />
                <img src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&q=80" className="w-full h-full object-cover rounded-tl-3xl rounded-tr-3xl rounded-bl-full rounded-br-3xl shadow-lg" />
                <img src="/classroom.webp" className="w-full h-full object-cover rounded-tl-3xl rounded-tr-3xl rounded-bl-3xl rounded-br-full shadow-lg" />
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 text-center lg:text-left">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#1A1A2E] mb-12 leading-[1.2]">
              <span className="bg-clip-text text-transparent bg-[#0047d6]">Benefits</span> From Our Online Learning
            </h2>

            <div className="space-y-8 text-left">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex gap-6 items-start group">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 ${idx % 2 === 0 ? 'bg-[#0047d6]' : 'bg-[#EF4444]'} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    <benefit.icon size={26} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-[#1A1A2E] mb-2">{benefit.title}</h4>
                    <p className="text-[#6E6E82] leading-relaxed text-lg max-w-[400px]">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Popular Courses Section */}
      <section className="bg-[#0047d6] py-24 relative overflow-hidden">
        {/* Subtle decorative background element */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5">Our Popular Courses</h2>
            <p className="text-white/90 max-w-lg mx-auto text-lg">Explore our most sought-after programs and take the next step in your educational journey.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
            {courses.map((course, idx) => (
              <div key={idx} className="bg-white rounded-[28px] p-5 shadow-2xl hover:-translate-y-2 transition-transform duration-300">
                <div className="relative h-56 mb-6 rounded-[20px] overflow-hidden group">
                  <img src={course.img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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

                  <div className="h-px bg-gray-100 mb-5"></div>

                  <div className="flex items-center justify-between">
                    <div>
                      {isPromoActive() ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-[#1A1A2E]">₦7,000</span>
                          <span className="text-lg font-medium text-[#6E6E82] line-through">₦10,000</span>
                        </div>
                      ) : (
                        <span className="text-3xl font-black text-[#1A1A2E]">₦10,000</span>
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

      {/* 3. Logo / Trust Strip */}
      <section className="bg-[#0047d6] py-10 overflow-hidden relative">
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
        <div className="flex w-[200%] animate-[marquee_20s_linear_infinite]">
          {[1, 2].map((set) => (
            <div key={set} className="flex-1 flex items-center justify-around opacity-70 px-4">
              <h3 className="text-white text-xl md:text-2xl font-black tracking-widest uppercase whitespace-nowrap">Olis</h3>
              <h3 className="text-white text-xl md:text-2xl font-black tracking-widest uppercase whitespace-nowrap">Olis</h3>
              <h3 className="text-white text-xl md:text-2xl font-black tracking-widest uppercase whitespace-nowrap">Olis</h3>
              <h3 className="text-white text-xl md:text-2xl font-black tracking-widest uppercase whitespace-nowrap">Olis</h3>
              <h3 className="text-white text-xl md:text-2xl font-black tracking-widest uppercase whitespace-nowrap">Olis</h3>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Become an Instructor (CTA) Section */}
      {/* <section className="bg-white py-24 overflow-hidden">
        <div className="container mx-auto px-6 md:px-12 lg:px-16 flex flex-col-reverse lg:flex-row items-center gap-16 lg:gap-24">
          <div className="lg:w-1/2 text-center lg:text-left">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#1A1A2E] mb-2 leading-[1.1]">
              If You Are A Certified Teacher Then
            </h2>
            <h2 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-[#0047d6] mb-6 leading-[1.2]">
              Become An Instructor
            </h2>
            <p className="text-[#6E6E82] text-lg mb-10 leading-relaxed max-w-lg mx-auto lg:mx-0">
              Share your knowledge with millions of students worldwide. Make It Simple provides you with the platform and tools to create, manage, and monetize your courses effectively.
            </p>
            
            <h3 className="text-2xl font-bold text-[#1A1A2E] mb-6">Enjoy Many Perks</h3>
            <div className="grid sm:grid-cols-2 gap-y-5 gap-x-8 mb-12 text-left max-w-xl mx-auto lg:mx-0">
              {['Global Impact', 'Flexible Schedule', 'Innovative Teaching Tools', 'Recognition And Reputation', 'Creative Freedom', 'Monetize Your Expertise', 'Professional Development', 'Networking Opportunities'].map((perk, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0047d6] shrink-0"></div>
                  <span className="text-[#1A1A2E] font-bold">{perk}</span>
                </div>
              ))}
            </div>
            
            <Link to="/signup?role=instructor" className="inline-block bg-[#0047d6] text-white px-10 py-4 rounded-full font-bold shadow-[0_15px_30px_rgba(0,71,214,0.3)] hover:-translate-y-1 transition-transform text-lg">
              Become an Instructor
            </Link>
          </div>
          
          <div className="lg:w-1/2 relative">
            <div className="relative w-full max-w-[480px] aspect-square mx-auto">
              <div className="absolute inset-[-6%] border-2 border-dashed border-[#0047d6]/50 rounded-full animate-[spin_40s_linear_infinite_reverse]"></div>
              
              <div className="absolute inset-[6%] bg-[#0047d6] rounded-t-full rounded-b-[40px] overflow-hidden shadow-2xl">
                <img src="https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=800&q=80" alt="Instructor" className="w-full h-full object-cover object-top mix-blend-luminosity opacity-80" />
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* 8. Testimonials Section */}
      <section className="bg-[#0047d6] py-24 relative overflow-hidden">
        {/* Subtle decorative background element */}
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>

        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5">Student's Testimonials</h2>
            <p className="text-white/90 max-w-lg mx-auto text-lg">Hear from our community of learners about their experiences and how Make It Simple has transformed their skills.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {testimonials.map((test, idx) => (
              <div key={idx} className="bg-white rounded-[32px] p-8 lg:p-10 shadow-2xl flex flex-col gap-6 transform hover:-translate-y-2 transition-transform duration-300">
                <div className="flex items-center gap-5">
                  <img src={test.img} className="w-16 h-16 rounded-full object-cover border-4 border-[#F8F1F7]" />
                  <div>
                    <h4 className="text-xl font-extrabold text-[#1A1A2E]">{test.name}</h4>
                    <p className="text-[#6E6E82] text-sm font-medium mb-1.5">{test.role}</p>
                    <div className="flex text-[#EF4444] gap-0.5">
                      {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                    </div>
                  </div>
                </div>
                <p className="text-[#6E6E82] leading-relaxed italic text-lg">"{test.text.replace(/"/g, '')}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A1A2E] pt-16 pb-10 text-white/60">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {/* Brand */}
            <div>
              <img src="/logo.PNG" alt="Make It Simple" className="h-10 mb-6 brightness-0 invert" />
              <p className="leading-relaxed">
                Transforming the way you learn with expert-led courses and interactive bootcamps designed for your success.
              </p>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="text-white font-bold text-lg mb-6">Quick Links</h4>
              <ul className="space-y-4 font-medium">
                <li><Link to="/bootcamp" className="hover:text-[#EF4444] transition-colors">Bootcamp</Link></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-white font-bold text-lg mb-6">Newsletter</h4>
              <p className="mb-4 text-sm">Subscribe to get the latest updates and offers.</p>
              {newsletterSubscribed ? (
                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-full text-sm font-medium">
                  <CheckCircle2 size={18} />
                  <span>Thanks for subscribing!</span>
                </div>
              ) : (
                <form className="flex flex-col gap-3" onSubmit={handleNewsletterSubmit}>
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Your email address"
                    className="bg-white/10 border border-white/20 rounded-full px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[#EF4444]"
                    required
                  />
                  <button type="submit" className="bg-[#0047d6] text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-[#003cb3] transition-colors">
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 text-center text-sm">
            <p>© {new Date().getFullYear()} Make It Simple. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
