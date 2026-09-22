import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div data-elementor-type="wp-post" data-elementor-id="2074" className="elementor elementor-2074">
      
      {/* Page Title Header */}
      <div className="elementor-element elementor-element-4ddd1f7 e-flex e-con-boxed e-con e-parent">
        <div className="e-con-inner">
          <div className="elementor-element elementor-element-381a3b4 elementor-widget elementor-widget-heading">
            <h2 className="elementor-heading-title elementor-size-default">Contact</h2>
          </div>
          <div className="elementor-element elementor-element-000e1ce elementor-widget elementor-widget-text-editor">
            <p><Link to="/">Home</Link> – Contact</p>
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="elementor-element elementor-element-3944076 e-flex e-con-boxed e-con e-parent" style={{ padding: '80px 0' }}>
        <div className="e-con-inner" style={{ flexDirection: 'column' }}>
          
          <div style={{ textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '800', fontSize: '14px', color: '#0047D6', marginBottom: '8px' }}>
            Contact Us
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#1A1A2E', marginBottom: '40px' }}>
            Let's Get in Touch
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '50px', alignItems: 'start' }}>
            
            {/* Left Column: Contact Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#1A1A2E', margin: 0 }}>Don't hesitate to say Hello to us!</h3>
              <p style={{ color: '#666', lineHeight: '1.7', fontSize: '15px' }}>
                Whether you have questions about course curriculums, corporate training, or platform support, our dedicated team is here to assist you every step of the way.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px 24px', background: '#FAFAFD', borderRadius: '16px', border: '1px solid #EAEAEA' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#0047D6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    <i className="fa-solid fa-location-dot"></i>
                  </div>
                  <div>
                    <h6 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '700', color: '#1A1A2E' }}>Office</h6>
                    <span style={{ fontSize: '14px', color: '#666' }}>456 Creative District Ahmad Yani, Medan</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px 24px', background: '#FAFAFD', borderRadius: '16px', border: '1px solid #EAEAEA' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#0047D6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    <i className="fa-solid fa-envelope"></i>
                  </div>
                  <div>
                    <h6 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '700', color: '#1A1A2E' }}>Email</h6>
                    <span style={{ fontSize: '14px', color: '#666' }}>hola@makeitsimple.com</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px 24px', background: '#FAFAFD', borderRadius: '16px', border: '1px solid #EAEAEA' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#0047D6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    <i className="fa-solid fa-phone"></i>
                  </div>
                  <div>
                    <h6 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '700', color: '#1A1A2E' }}>Phone</h6>
                    <span style={{ fontSize: '14px', color: '#666' }}>+800-3374-4676</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Contact Form */}
            <div style={{ background: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 15px 40px rgba(0,0,0,0.06)', border: '1px solid #EAEAEA' }}>
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#E6F4EA', color: '#137333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 20px' }}>
                    <i className="fa-solid fa-check"></i>
                  </div>
                  <h3 style={{ color: '#1A1A2E', fontSize: '24px', fontWeight: '800', marginBottom: '12px' }}>Message Sent!</h3>
                  <p style={{ color: '#666', fontSize: '15px' }}>Thank you for reaching out. A representative from our team will respond to your message shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#333', marginBottom: '8px' }}>Name *</label>
                      <input required type="text" placeholder="Your Real Name" style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '1px solid #DDD', fontSize: '14px', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#333', marginBottom: '8px' }}>Email *</label>
                      <input required type="email" placeholder="Email" style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '1px solid #DDD', fontSize: '14px', outline: 'none' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#333', marginBottom: '8px' }}>Phone Number *</label>
                      <input required type="tel" placeholder="+62-8123-" style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '1px solid #DDD', fontSize: '14px', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#333', marginBottom: '8px' }}>Subject *</label>
                      <input required type="text" placeholder="Subject" style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '1px solid #DDD', fontSize: '14px', outline: 'none' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#333', marginBottom: '8px' }}>Message *</label>
                    <textarea required rows={5} placeholder="Write your message..." style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '1px solid #DDD', fontSize: '14px', outline: 'none', resize: 'vertical' }}></textarea>
                  </div>

                  <button type="submit" style={{ background: '#0047D6', color: '#fff', padding: '16px 32px', border: 'none', borderRadius: '30px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', transition: 'all 0.3s' }}>
                    Submit Message
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
