import { Link } from 'react-router-dom';

export default function TestimonialsPage() {
  const testimonials = [
    {
      name: 'Michael Adams',
      role: 'Marketing Manager',
      text: '"The courses transformed my skills quickly, boosting confidence and opening exciting opportunities in my professional career."',
      avatar: '/assets/images/UBNG9AEk.jpg',
      rating: 5,
    },
    {
      name: 'Lisa Collins',
      role: 'Graphic Designer',
      text: '"This platform gave me valuable knowledge, global connections, and confidence to pursue my dreams with passion."',
      avatar: '/assets/images/Coba-3a.jpg',
      rating: 5,
    },
    {
      name: 'Daniel Wong',
      role: 'Data Analyst',
      text: '"Expert instructors made complex topics simple, enjoyable, and impactful. I now feel more prepared for real challenges."',
      avatar: '/assets/images/UBNG9AEb.jpg',
      rating: 5,
    },
    {
      name: 'Emma Turner',
      role: 'Software Engineer',
      text: '"Learning here is flexible, engaging, and practical. It truly helped me achieve growth and advance my career."',
      avatar: '/assets/images/UBNG9AEn.jpg',
      rating: 5,
    },
  ];

  const partners = [
    '/assets/images/KWK2AKS.png',
    '/assets/images/AT63WGP.png',
    '/assets/images/3CPH8BT.png',
    '/assets/images/XNBA63.png',
    '/assets/images/KUZFHM.png',
    '/assets/images/Z26JS9.png',
  ];

  return (
    <div data-elementor-type="wp-post" data-elementor-id="2036" className="elementor elementor-2036">
      
      {/* Title Header */}
      <div className="elementor-element elementor-element-b9b6516 e-flex e-con-boxed e-con e-parent">
        <div className="e-con-inner">
          <div className="elementor-element elementor-element-f07e456 elementor-widget elementor-widget-heading">
            <h2 className="elementor-heading-title elementor-size-default">Testimonials</h2>
          </div>
          <div className="elementor-element elementor-element-4e28c20 elementor-widget elementor-widget-text-editor">
            <p><Link to="/">Home</Link> – Testimonials</p>
          </div>
        </div>
      </div>

      {/* Main Feedback Section */}
      <div className="elementor-element elementor-element-ada4dea e-flex e-con-boxed e-con e-parent" style={{ padding: '80px 0', background: '#FAFAFD' }}>
        <div className="e-con-inner" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <h5 style={{ color: '#0047D6', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '800', fontSize: '14px', marginBottom: '8px' }}>Our Feedback</h5>
          <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#1A1A2E', marginBottom: '16px' }}>Trusted Voices Of Learners</h2>
          <p style={{ color: '#666', maxWidth: '600px', lineHeight: '1.7', fontSize: '15px', marginBottom: '50px' }}>
            Discover authentic testimonials from students who transformed their knowledge, boosted confidence, and achieved meaningful goals through our learning programs.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', width: '100%' }}>
            {testimonials.map((item, idx) => (
              <div key={idx} style={{ background: '#fff', borderRadius: '20px', padding: '35px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #eee', textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ color: '#FFB800', display: 'flex', gap: '4px', marginBottom: '20px' }}>
                    {[...Array(item.rating)].map((_, i) => (
                      <i key={i} className="fa-solid fa-star" style={{ fontSize: '14px' }}></i>
                    ))}
                  </div>
                  <p style={{ color: '#555', fontSize: '15px', lineHeight: '1.7', fontStyle: 'italic', marginBottom: '25px' }}>{item.text}</p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '20px', borderTop: '1px solid #F0F0F5' }}>
                  <img src={item.avatar} alt={item.name} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1A1A2E' }}>{item.name}</h4>
                    <span style={{ fontSize: '13px', color: '#666' }}>{item.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Partners Logos Section */}
      <div className="elementor-element elementor-element-3f2116d e-flex e-con-boxed e-con e-parent" style={{ padding: '60px 0', borderTop: '1px solid #eee' }}>
        <div className="e-con-inner" style={{ flexDirection: 'column', alignItems: 'center', gap: '30px' }}>
          <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Our Partners:</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '40px', width: '100%', alignItems: 'center', justifyItems: 'center' }}>
            {partners.map((logo, index) => (
              <img key={index} src={logo} alt={`Partner ${index}`} style={{ maxHeight: '40px', filter: 'grayscale(100%)', opacity: 0.6, transition: 'all 0.3s' }} onMouseEnter={(e) => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.opacity = '1'; }} onMouseLeave={(e) => { e.currentTarget.style.filter = 'grayscale(100%)'; e.currentTarget.style.opacity = '0.6'; }} />
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
