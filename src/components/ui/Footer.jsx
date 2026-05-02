import { Link } from 'react-router-dom';

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-vy-black border-t border-vy-border/30 py-12 px-6 md:px-12">
      <div className="max-w-screen-xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="font-display font-bold text-2xl tracking-[0.4em] text-vy-white mb-4">VYBERA</h3>
            <p className="text-vy-light/70 text-sm leading-relaxed max-w-xs">
              The Era of Vibes. Premium oversized streetwear crafted for those who define the next generation of style.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-vy-white text-xs font-semibold tracking-widest uppercase mb-4">Navigate</h4>
            <ul className="space-y-3">
              {[['Shop', '/shop'], ['Customize', '/customize'], ['About', '/about'], ['Contact', '/contact']].map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="text-vy-light/60 text-sm hover:text-vy-accent transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-vy-white text-xs font-semibold tracking-widest uppercase mb-4">Legal</h4>
            <ul className="space-y-3">
              {[['Privacy Policy', '/privacy-policy'], ['Terms & Conditions', '/terms'], ['Refund Policy', '/refund-policy'], ['Shipping Policy', '/shipping-policy']].map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="text-vy-light/60 text-sm hover:text-vy-accent transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-vy-white text-xs font-semibold tracking-widest uppercase mb-4">Account</h4>
            <ul className="space-y-3">
              {[['Sign In', '/login'], ['Sign Up', '/signup']].map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="text-vy-light/60 text-sm hover:text-vy-accent transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-vy-border/30 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-vy-light/40 text-xs tracking-wider">
            © {year} VYBERA. All Rights Reserved.
          </p>
          <p className="text-vy-accent/60 text-xs tracking-wider font-medium">
            The Era of Vibes.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
