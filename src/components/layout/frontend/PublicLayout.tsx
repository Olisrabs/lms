import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function PublicLayout() {
  useEffect(() => {
    const prevClass = document.body.className;
    const hadDark = document.documentElement.classList.contains('dark');
    document.documentElement.classList.remove('dark');
    document.body.className = "wp-singular envato_tk_templates-template envato_tk_templates-template-elementor_header_footer single single-envato_tk_templates wp-embed-responsive wp-theme-hello-elementor hello-elementor-default elementor-default elementor-template-full-width elementor-page-template-full-width elementor-kit-3 elementor-page";
    return () => {
      document.body.className = prevClass;
      if (hadDark) {
        document.documentElement.classList.add('dark');
      }
    };
  }, []);

  return (
    <div className="wp-singular envato_tk_templates-template envato_tk_templates-template-elementor_header_footer single single-envato_tk_templates wp-embed-responsive wp-theme-hello-elementor hello-elementor-default elementor-default elementor-template-full-width elementor-page-template-full-width elementor-kit-3 elementor-page">
      <Header />
      <main id="content" className="site-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
