import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import kiscsibeLogo from "@/assets/kiscsibe_logo.jpeg";

interface FooterProps {
  className?: string;
}

const Footer = ({ className }: FooterProps) => {
  const navigate = useNavigate();
  const [adminClickCount, setAdminClickCount] = useState(0);
  const [staffClickCount, setStaffClickCount] = useState(0);
  const adminClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const staffClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (adminClickTimeoutRef.current) {
        clearTimeout(adminClickTimeoutRef.current);
      }
      if (staffClickTimeoutRef.current) {
        clearTimeout(staffClickTimeoutRef.current);
      }
    };
  }, []);

  const handleAdminLogoClick = () => {
    const newCount = adminClickCount + 1;
    setAdminClickCount(newCount);

    if (adminClickTimeoutRef.current) {
      clearTimeout(adminClickTimeoutRef.current);
    }

    if (newCount >= 5) {
      navigate('/auth');
      setAdminClickCount(0);
    } else {
      adminClickTimeoutRef.current = setTimeout(() => {
        setAdminClickCount(0);
      }, 2000);
    }
  };

  const handleStaffLogoClick = () => {
    const newCount = staffClickCount + 1;
    setStaffClickCount(newCount);

    if (staffClickTimeoutRef.current) {
      clearTimeout(staffClickTimeoutRef.current);
    }

    if (newCount >= 5) {
      navigate('/auth');
      setStaffClickCount(0);
    } else {
      staffClickTimeoutRef.current = setTimeout(() => {
        setStaffClickCount(0);
      }, 2000);
    }
  };

  const navLinks = [
    { href: "/", label: "Főoldal" },
    { href: "/etlap", label: "Napi Ajánlat" },
    { href: "/about", label: "Rólunk" },
    { href: "/contact", label: "Kapcsolat" },
  ];

  return (
    <footer className={`bg-gray-900 text-gray-300 ${className || ""}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Admin Logo Section - Left */}
          <div className="flex flex-col items-center lg:items-start">
            <button
              onClick={handleAdminLogoClick}
              className="group flex flex-col items-center focus:outline-none"
              aria-label="Kiscsibe logó"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/30 transition-transform duration-200 group-active:scale-95">
                <img
                  src={kiscsibeLogo}
                  alt="Kiscsibe Reggeliző & Étterem logó"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="mt-3 text-white font-sofia font-bold text-lg">
                Kiscsibe
              </h3>
              <p className="text-gray-400 text-sm">Reggeliző & Étterem</p>
            </button>
          </div>

          {/* Contact Info */}
          <div className="text-center md:text-left">
            <h4 className="text-white font-semibold text-lg mb-4">Elérhetőség</h4>
            <ul className="space-y-3">
              <li className="flex items-start justify-center md:justify-start gap-2">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">1145 Budapest, Vezér utca 12.</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-2">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <a href="tel:+3612345678" className="text-sm hover:text-primary transition-colors">
                  +36 1 234 5678
                </a>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-2">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <a href="mailto:kiscsibeetterem@gmail.com" className="text-sm hover:text-primary transition-colors">
                  kiscsibeetterem@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div className="text-center md:text-left">
            <h4 className="text-white font-semibold text-lg mb-4">Nyitvatartás</h4>
            <ul className="space-y-2">
              <li className="flex items-center justify-center md:justify-start gap-2">
                <Clock className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm">Hétfő - Péntek</span>
              </li>
              <li className="text-sm ml-7 text-green-400 font-medium">7:00 - 16:00</li>
              <li className="text-sm ml-7 text-gray-500 mt-2">Szombat - Vasárnap</li>
              <li className="text-sm ml-7 text-red-400">Zárva</li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="text-center md:text-left">
            <h4 className="text-white font-semibold text-lg mb-4">Gyors linkek</h4>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Staff Logo Section - Right */}
          <div className="hidden lg:flex flex-col items-end">
            <button
              onClick={handleStaffLogoClick}
              className="group flex flex-col items-center focus:outline-none"
              aria-label="Személyzeti belépés"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-700 transition-transform duration-200 group-active:scale-95 opacity-60 hover:opacity-80">
                <img
                  src={kiscsibeLogo}
                  alt="Kiscsibe"
                  className="w-full h-full object-cover"
                />
              </div>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 mt-10 pt-6">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Kiscsibe Reggeliző & Étterem. Minden jog fenntartva.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
