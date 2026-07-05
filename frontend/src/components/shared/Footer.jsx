import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-[#0A0A0A] border-t border-neutral-900 text-neutral-500 text-xs select-none">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 flex flex-col items-center">
        {/* Brand Name */}
        <h2 className="text-lg font-bold text-neutral-300 tracking-wider mb-2">CINEVERSE</h2>
        <p className="text-[11px] text-neutral-600 mb-6 text-center max-w-sm">
          Experience the silver screen like never before. Premium tickets, instant confirmations, and real-time seat tracking.
        </p>

        {/* Social Icons */}
        <div className="flex gap-4 mb-8">
          <a
            href="#"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-850 bg-neutral-900/40 text-neutral-400 hover:text-white hover:border-neutral-700 hover:bg-neutral-900 transition-all"
            aria-label="Facebook"
          >
            <FaFacebookF className="w-3.5 h-3.5" />
          </a>
          <a
            href="#"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-850 bg-neutral-900/40 text-neutral-400 hover:text-white hover:border-neutral-700 hover:bg-neutral-900 transition-all"
            aria-label="Twitter"
          >
            <FaTwitter className="w-3.5 h-3.5" />
          </a>
          <a
            href="#"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-850 bg-neutral-900/40 text-neutral-400 hover:text-white hover:border-neutral-700 hover:bg-neutral-900 transition-all"
            aria-label="Instagram"
          >
            <FaInstagram className="w-3.5 h-3.5" />
          </a>
          <a
            href="#"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-850 bg-neutral-900/40 text-neutral-400 hover:text-white hover:border-neutral-700 hover:bg-neutral-900 transition-all"
            aria-label="LinkedIn"
          >
            <FaLinkedinIn className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Copyright */}
        <div className="text-[10px] text-neutral-600 border-t border-neutral-900/60 pt-4 w-full text-center">
          <p>© 2026 CineVerse. All rights reserved. Designed for ultimate cinema booking.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;