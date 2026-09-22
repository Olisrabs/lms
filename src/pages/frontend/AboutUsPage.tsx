import { Link } from 'react-router-dom';

export default function AboutUsPage() {
  const features = [
    { title: 'Qualified Teachers', desc: 'Experienced educators guiding with proven expertise', icon: '/assets/images/NLU6ZK8a.png' },
    { title: 'Certified Institute', desc: 'Officially recognized with globally trusted certifications', icon: '/assets/images/NLU6ZK8c.png' },
    { title: 'Modern Curriculum', desc: 'Up-to-date courses aligned with industry needs', icon: '/assets/images/NLU6ZK8b.png' },
    { title: 'Flexible Learning', desc: 'Study anytime anywhere with complete freedom', icon: '/assets/images/NLU6ZK8d.png' }
  ];

  return (
    <div data-elementor-type="wp-post" data-elementor-id="1876" className="elementor elementor-1876">
      
      {/* Header Banner */}
      <div className="elementor-element elementor-element-15b23d3 e-flex e-con-boxed e-con e-parent">
        <div className="e-con-inner">
          <div className="elementor-element elementor-element-d543e69 elementor-widget elementor-widget-heading">
            <h2 className="elementor-heading-title elementor-size-default">About Us</h2>
          </div>
          <div className="elementor-element elementor-element-17fdbda elementor-widget elementor-widget-text-editor">
            <p><Link to="/">Home</Link> – About Us</p>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="elementor-element elementor-element-730e5cb e-flex e-con-boxed e-con e-parent">
        <div className="e-con-inner">
          <div className="elementor-element elementor-element-702a740 e-con-full e-flex e-con e-child">
            <div className="elementor-element elementor-element-61efbcc e-con-full e-flex e-con e-child">
              <div className="elementor-element elementor-element-f02033c elementor-widget elementor-widget-heading">
                <h5 className="elementor-heading-title elementor-size-default">About Us</h5>
              </div>
              <div className="elementor-element elementor-element-f22e10c elementor-widget elementor-widget-heading">
                <h2 className="elementor-heading-title elementor-size-default">Committed To Excellence In Online Education</h2>
              </div>
              <div className="elementor-element elementor-element-93534b2 elementor-widget elementor-widget-text-editor">
                <p>Our platform is built on trust, quality, and innovation, ensuring learners everywhere access knowledge that truly empowers and inspires.</p>
              </div>
            </div>
            
            <div className="elementor-element elementor-element-c4c3f5d e-con-full e-flex e-con e-child">
              <div style={{ position: 'relative', width: '100%', borderRadius: '16px', overflow: 'hidden', height: '350px' }}>
                <img src="/assets/images/TN4P97R.jpg" alt="About Video Overlay" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <a href="https://www.youtube.com/watch?v=XHOmBV4js_E" target="_blank" rel="noreferrer" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '70px', height: '70px', background: '#0047D6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px', boxShadow: '0 10px 25px rgba(0, 71, 214, 0.4)' }}>
                  <i className="icon icon-play1"></i>
                </a>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '30px', marginTop: '60px', width: '100%' }}>
            {features.map((f, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #eee', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <img src={f.icon} alt={f.title} style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px', color: '#1A1A2E' }}>{f.title}</h4>
                  <p style={{ fontSize: '13px', color: '#666', margin: 0, lineHeight: '1.4' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Commitment Section */}
      <div className="elementor-element elementor-element-1368786 e-flex e-con-boxed e-con e-parent" style={{ background: '#fcfcfd', padding: '80px 0' }}>
        <div className="e-con-inner" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'center' }}>
          <div>
            <span style={{ color: '#0047D6', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase' }}>Join Our Community</span>
            <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#1A1A2E', marginTop: '10px', marginBottom: '20px', lineHeight: '1.3' }}>
              Learn Smarter. Grow Faster With Make It Simple.
            </h2>
            <p style={{ color: '#666', fontSize: '15px', lineHeight: '1.7', marginBottom: '24px' }}>
              Transform your ambition into success with real-world skills taught by industry practitioners. Access lifetime resources, interactive community forums, and continuous mentorship.
            </p>
            <Link to="/signup" className="elementor-button elementor-button-link elementor-size-sm elementor-animation-shrink">
              <span className="elementor-button-content-wrapper">
                <span className="elementor-button-icon"><i className="icon icon-right-arrow"></i></span>
                <span className="elementor-button-text">Join Us Today</span>
              </span>
            </Link>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <img src="/assets/images/UBNG9AEb.jpg" alt="Student 1" style={{ width: '48%', borderRadius: '16px', objectFit: 'cover' }} />
            <img src="/assets/images/UBNG9AEn.jpg" alt="Student 2" style={{ width: '48%', borderRadius: '16px', objectFit: 'cover' }} />
          </div>
        </div>
      </div>

    </div>
  );
}
