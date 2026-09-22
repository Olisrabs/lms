import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="ekit-template-content-markup ekit-template-content-header ekit-template-content-theme-support">
      <div data-elementor-type="wp-post" data-elementor-id="797" className="elementor elementor-797">
        <div className="elementor-element elementor-element-a5b3a25 e-flex e-con-boxed e-con e-parent" data-id="a5b3a25" data-element_type="container">
          <div className="e-con-inner">
            <div className="elementor-element elementor-element-85cb2d0 e-con-full e-flex e-con e-child" data-id="85cb2d0" data-element_type="container">
              
              {/* Logo */}
              <div className="elementor-element elementor-element-bdf90b0 e-con-full e-flex e-con e-child" data-id="bdf90b0" data-element_type="container">
                <div className="elementor-element elementor-element-f740b40 elementor-widget elementor-widget-image" data-id="f740b40" data-element_type="widget" data-widget_type="image.default">
                  <Link to="/">
                    <img width="300" height="81" src="/logo.PNG" className="attachment-full size-full wp-image-1459" alt="Make It Simple Logo" />
                  </Link>
                </div>
              </div>

              {/* Navigation Menu */}
              <div className="elementor-element elementor-element-d2b9cce e-con-full e-flex e-con e-child" data-id="d2b9cce" data-element_type="container">
                <div className="elementor-element elementor-element-34fcbdc elementor-widget elementor-widget-ekit-nav-menu" data-id="34fcbdc" data-element_type="widget" data-widget_type="ekit-nav-menu.default">
                  <div className="elementor-widget-container">
                    <nav className={`ekit-wid-con ekit_menu_responsive_tablet ${mobileMenuOpen ? 'elementskit-menu-open' : ''}`} data-responsive-breakpoint="1024">
                      
                      {/* Mobile Hamburger Toggler */}
                      <button 
                        className="elementskit-menu-hamburger elementskit-menu-toggler" 
                        type="button" 
                        aria-label="hamburger-icon"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                      >
                        <span className="elementskit-menu-hamburger-icon"></span>
                        <span className="elementskit-menu-hamburger-icon"></span>
                        <span className="elementskit-menu-hamburger-icon"></span>
                      </button>

                      <div id="ekit-megamenu-makeitsimple-menu" className={`elementskit-menu-container elementskit-menu-offcanvas-elements elementskit-navbar-nav-default ekit-nav-menu-one-page-no ekit-nav-dropdown-hover ${mobileMenuOpen ? 'active' : ''}`}>
                        <ul id="menu-makeitsimple-menu" className="elementskit-navbar-nav elementskit-menu-po-center submenu-click-on-icon">
                          
                          {/* Home */}
                          <li className={`menu-item nav-item elementskit-mobile-builder-content ${isActive('/') ? 'active' : ''}`}>
                            <Link to="/" className={`ekit-menu-nav-link ${isActive('/') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                              Home
                            </Link>
                          </li>

                          {/* About Us */}
                          <li className={`menu-item nav-item elementskit-mobile-builder-content ${isActive('/about-us') ? 'active' : ''}`}>
                            <Link to="/about-us" className={`ekit-menu-nav-link ${isActive('/about-us') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                              About Us
                            </Link>
                          </li>

                          {/* Testimonials */}
                          <li className={`menu-item nav-item elementskit-mobile-builder-content ${isActive('/testimonials') ? 'active' : ''}`}>
                            <Link to="/testimonials" className={`ekit-menu-nav-link ${isActive('/testimonials') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                              Testimonials
                            </Link>
                          </li>

                          {/* Contact */}
                          <li className={`menu-item nav-item elementskit-mobile-builder-content ${isActive('/contact') ? 'active' : ''}`}>
                            <Link to="/contact" className={`ekit-menu-nav-link ${isActive('/contact') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                              Contact
                            </Link>
                          </li>
                        </ul>

                        {/* Mobile Identity Panel / Close button */}
                        <div className="elementskit-nav-identity-panel">
                          <Link className="elementskit-nav-logo" to="/">
                            <img src="/logo.PNG" title="Make It Simple Logo" alt="Make It Simple Logo" style={{ maxHeight: '36px' }} />
                          </Link>
                          <button className="elementskit-menu-close elementskit-menu-toggler" type="button" onClick={() => setMobileMenuOpen(false)}>
                            X
                          </button>
                        </div>
                      </div>

                      {/* Overlay */}
                      {mobileMenuOpen && (
                        <div className="elementskit-menu-overlay elementskit-menu-offcanvas-elements elementskit-menu-toggler ekit-nav-menu--overlay" onClick={() => setMobileMenuOpen(false)}></div>
                      )}
                    </nav>
                  </div>
                </div>
              </div>

              {/* Social Icons & Get Started Button */}
              <div className="elementor-element elementor-element-f8ab637 e-con-full elementor-hidden-tablet elementor-hidden-mobile e-flex e-con e-child" data-id="f8ab637" data-element_type="container">
                <div className="elementor-element elementor-element-899e3e6 e-con-full e-flex e-con e-child" data-id="899e3e6" data-element_type="container">
                  <div className="elementor-element elementor-element-f5331b2 elementor-shape-rounded elementor-grid-0 e-grid-align-center elementor-widget elementor-widget-social-icons" data-id="f5331b2" data-element_type="widget" data-widget_type="social-icons.default">
                    <div className="elementor-social-icons-wrapper elementor-grid" role="list">
                      <span className="elementor-grid-item" role="listitem">
                        <a className="elementor-icon elementor-social-icon elementor-social-icon-facebook-f elementor-animation-shrink" href="#" target="_blank" rel="noreferrer">
                          <span className="elementor-screen-only">Facebook-f</span>
                          <svg aria-hidden="true" className="e-font-icon-svg e-fab-facebook-f" viewBox="0 0 320 512" xmlns="http://www.w3.org/2000/svg"><path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"></path></svg>
                        </a>
                      </span>
                      <span className="elementor-grid-item" role="listitem">
                        <a className="elementor-icon elementor-social-icon elementor-social-icon-twitter elementor-animation-shrink" href="#" target="_blank" rel="noreferrer">
                          <span className="elementor-screen-only">Twitter</span>
                          <svg aria-hidden="true" className="e-font-icon-svg e-fab-twitter" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"></path></svg>
                        </a>
                      </span>
                      <span className="elementor-grid-item" role="listitem">
                        <a className="elementor-icon elementor-social-icon elementor-social-icon-youtube elementor-animation-shrink" href="#" target="_blank" rel="noreferrer">
                          <span className="elementor-screen-only">Youtube</span>
                          <svg aria-hidden="true" className="e-font-icon-svg e-fab-youtube" viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg"><path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"></path></svg>
                        </a>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="elementor-element elementor-element-674e54d e-con-full e-flex e-con e-child" data-id="674e54d" data-element_type="container">
                  <div className="elementor-element elementor-element-4025c3f elementor-align-right elementor-widget elementor-widget-button" data-id="4025c3f" data-element_type="widget" data-widget_type="button.default">
                    <Link className="elementor-button elementor-button-link elementor-size-sm elementor-animation-shrink" to="/signin" style={{ padding: '9px 20px', fontSize: '14px', borderRadius: '24px' }}>
                      <span className="elementor-button-content-wrapper">
                        <span className="elementor-button-icon">
                          <i aria-hidden="true" className="icon icon-arrow-right" style={{ fontSize: '13px' }}></i>
                        </span>
                        <span className="elementor-button-text">Get Started</span>
                      </span>
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
