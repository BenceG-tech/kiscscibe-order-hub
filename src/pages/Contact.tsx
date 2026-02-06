import ModernNavigation from "@/components/ModernNavigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Phone, Mail, Clock, Car, Bus, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import heroImage from "@/assets/hero-desktop.png";
import ContactInfo from "@/components/contact/ContactInfo";
import ContactForm from "@/components/contact/ContactForm";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <ModernNavigation />
      <main className="pt-20">
        {/* Hero Section with image */}
        <section className="relative h-[35vh] md:h-[40vh] overflow-hidden">
          <img 
            src={heroImage} 
            alt="Kapcsolat"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white px-6">
              <h1 className="text-3xl md:text-5xl font-sofia font-bold mb-2 animate-fade-in-up">
                Kapcsolat
              </h1>
              <p className="text-lg md:text-xl text-gray-200 animate-fade-in-up opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
                Vegye fel velünk a kapcsolatot!
              </p>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            <ContactInfo />
            <ContactForm />
          </div>

          {/* Embedded Map */}
          <div className="mt-12 md:mt-16">
            <h2 className="text-2xl font-bold text-center text-foreground mb-8">Találjon meg minket!</h2>
            <div className="rounded-3xl overflow-hidden shadow-lg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2695.4692819165434!2d19.1213!3d47.5597!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDfCsDMzJzM1LjAiTiAxOcKwMDcnMTYuNyJF!5e0!3m2!1shu!2shu!4v1642782234567!5m2!1shu!2shu"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Kiscsibe Reggeliző & Étterem térképe"
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
