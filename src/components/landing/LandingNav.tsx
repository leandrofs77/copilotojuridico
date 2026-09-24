import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import virtualexisLogoFull from "@/assets/virtualexis-logo-full.png";

const navLinks = [
  { label: "Solução", href: "#solucao" },
  { label: "Tecnologia", href: "#tecnologia" },
  { label: "Planos", href: "#planos" },
  { label: "FAQ", href: "#faq" },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[hsl(220,30%,6%)]/80 backdrop-blur-xl border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <a href="#" className="flex items-center">
          <img src={virtualexisLogoFull} alt="VirtuaLexis" className="h-8 object-contain" />
        </a>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-white/60 hover:text-white transition-colors">
              {l.label}
            </a>
          ))}
          <Link to="/login">
            <Button variant="outline" size="sm" className="border-white/30 text-white bg-white/10 hover:bg-white/20">
              Entrar
            </Button>
          </Link>
          <a href="#planos">
            <Button size="sm" className="bg-gradient-to-r from-[hsl(200,80%,55%)] to-[hsl(260,70%,65%)] text-white border-0 hover:opacity-90">
              Começar grátis
            </Button>
          </a>
        </div>

        <button className="md:hidden text-white" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-[hsl(220,30%,6%)]/95 backdrop-blur-xl border-t border-white/5 p-4 space-y-3">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block text-sm text-white/70 hover:text-white py-2">
              {l.label}
            </a>
          ))}
          <Link to="/login" onClick={() => setOpen(false)}>
            <Button variant="outline" size="sm" className="w-full border-white/30 text-white bg-white/10 hover:bg-white/20">Entrar</Button>
          </Link>
        </div>
      )}
    </nav>
  );
}
