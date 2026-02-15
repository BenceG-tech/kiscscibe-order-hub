import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin, Mail, Clock, Facebook, Instagram } from "lucide-react";
import kiscsibeLogo from "@/assets/kiscsibe_logo_round.png";
import { useRestaurantSettings } from "@/hooks/useRestaurantSettings";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.69a8.16 8.16 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.12z"/>
  </svg>
);

interface FooterProps {
  className?: string;
}

const Footer = ({ className }: FooterProps) => {
  const navigate = useNavigate();
  const [adminClickCount, setAdminClickCount] = useState(0);
  const [staffClickCount, setStaffClickCount] = useState(0);
  const adminClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const staffClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { openingHours, address } = useRestaurantSettings();

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
    { href: "/gallery", label: "Galéria" },
    { href: "/about", label: "Rólunk" },
    { href: "/contact", label: "Kapcsolat" },
  ];

  const legalLinks = [
    { href: "/impresszum", label: "Impresszum" },
    { href: "/adatvedelem", label: "Adatvédelmi Tájékoztató" },
    { href: "/aszf", label: "ÁSZF" },
    { href: "/cookie-szabalyzat", label: "Süti Szabályzat" },
  ];

  const SocialIcons = ({ size = "w-8 h-8", iconSize = "h-4 w-4" }: { size?: string; iconSize?: string }) => (
    <div className="flex items-center gap-2">
      <a 
        href="https://www.facebook.com/kiscsibeetteremXIV" 
        target="_blank" 
        rel="noopener noreferrer"
        className={`${size} rounded-lg bg-primary/20 flex items-center justify-center hover:bg-primary hover:text-white transition-colors text-primary`}
        aria-label="Facebook"
      >
        <Facebook className={iconSize} />
      </a>
      <a 
        href="#" 
        className={`${size} rounded-lg bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-colors text-gray-400 opacity-60`}
        aria-label="Instagram (hamarosan)"
      >
        <Instagram className={iconSize} />
      </a>
      <a 
        href="#" 
        className={`${size} rounded-lg bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-colors text-gray-400 opacity-60`}
        aria-label="TikTok (hamarosan)"
      >
        <TikTokIcon className={iconSize} />
      </a>
    </div>
  );

  // Format hours for footer display
  const monFriHours = openingHours.mon_fri === "closed" ? "Zárva" : openingHours.mon_fri.replace("-", " - ");
  const isSatClosed = openingHours.sat === "closed";
  const isSunClosed = openingHours.sun === "closed";

  return (
    <footer className={`bg-gray-900 text-gray-300 ${className || ""}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        
        {/* Mobile: Logo centered on top */}
        <div className="flex justify-center mb-6 md:hidden">
          <button
            onClick={handleAdminLogoClick}
            className="group flex flex-col items-center focus:outline-none"
            aria-label="Kiscsibe logó"
          >
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/30 transition-transform duration-200 group-active:scale-95">
              <img
                src={kiscsibeLogo}
                alt="Kiscsibe Reggeliző & Étterem logó"
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="mt-2 text-white font-sofia font-bold text-base">
              Kiscsibe
            </h3>
            <p className="text-gray-400 text-xs">Reggeliző & Étterem</p>
          </button>
        </div>

        {/* Mobile: 2-column grid for compact layout */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:hidden">
          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Elérhetőség</h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-1.5">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="text-xs">{address.full}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <a href="mailto:kiscsibeetterem@gmail.com" className="text-xs hover:text-primary transition-colors break-all">
                  kiscsibeetterem@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Nyitvatartás</h4>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs">Hétfő - Péntek</span>
              </li>
              <li className="text-xs ml-5 text-green-400 font-medium">{monFriHours}</li>
              <li className="text-xs ml-5 text-gray-500 mt-1">Szombat - Vasárnap</li>
              <li className="text-xs ml-5 text-red-400">{isSatClosed && isSunClosed ? "Zárva" : isSatClosed ? `Szo: Zárva • V: ${openingHours.sun}` : `Szo: ${openingHours.sat} • V: Zárva`}</li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Gyors linkek</h4>
            <ul className="space-y-1.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-xs hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Jogi információk</h4>
            <ul className="space-y-1.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-xs hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social - Mobile full width */}
          <div className="col-span-2">
            <h4 className="text-white font-semibold text-sm mb-3">Kövess minket</h4>
            <SocialIcons />
          </div>
        </div>

        {/* Desktop: original 6-column grid */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-6 gap-8">
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
            {/* Social icons under logo on desktop */}
            <div className="mt-4">
              <SocialIcons />
            </div>
          </div>

          {/* Contact Info */}
          <div className="text-center md:text-left">
            <h4 className="text-white font-semibold text-lg mb-4">Elérhetőség</h4>
            <ul className="space-y-3">
              <li className="flex items-start justify-center md:justify-start gap-2">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">{address.full}</span>
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
              <li className="text-sm ml-7 text-green-400 font-medium">{monFriHours}</li>
              <li className="text-sm ml-7 text-gray-500 mt-2">Szombat - Vasárnap</li>
              <li className="text-sm ml-7 text-red-400">{isSatClosed && isSunClosed ? "Zárva" : isSatClosed ? `Szo: Zárva • V: ${openingHours.sun}` : `Szo: ${openingHours.sat} • V: Zárva`}</li>
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

          {/* Legal Links */}
          <div className="text-center md:text-left">
            <h4 className="text-white font-semibold text-lg mb-4">Jogi információk</h4>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
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
        <div className="border-t border-gray-800 mt-8 md:mt-10 pt-4 md:pt-6">
          <p className="text-center text-gray-500 text-xs md:text-sm">
            © {new Date().getFullYear()} Kiscsibe Reggeliző & Étterem. Minden jog fenntartva.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
