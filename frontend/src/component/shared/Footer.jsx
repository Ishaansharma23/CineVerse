import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";
import logo from "../../assets/main-icon-white.png";

const Footer = () => {
  return (
    <div className="bg-[#2b2b2b] text-gray-400 text-sm">
      <div className="border-t border-gray-600 w-full">
        
        <div className="flex flex-col items-center py-6">
          <img
            src={logo}
            alt="Logo"
            className="w-28 mb-4 mt-2"
          />
        </div>

        <div className="flex justify-center gap-6 mb-2">
          <a
            href="#"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-700 text-white hover:bg-gray-600 transition"
          >
            <FaFacebookF />
          </a>

          <a
            href="#"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-700 text-white hover:bg-gray-600 transition"
          >
            <FaTwitter />
          </a>

          <a
            href="#"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-700 text-white hover:bg-gray-600 transition"
          >
            <FaInstagram />
          </a>

          <a
            href="#"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-700 text-white hover:bg-gray-600 transition"
          >
            <FaLinkedinIn />
          </a>
        </div>

        <div className="py-4 text-center">
          <p>© 2026 CineVerse. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Footer;