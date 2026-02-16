import { useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useScrollFadeIn } from "@/hooks/useScrollFadeIn";
import { cn } from "@/lib/utils";

const FAQSection = () => {
  const { ref, isVisible } = useScrollFadeIn();

  const faqs = [
    {
      question: "Meddig lehet rendelni?",
      answer: "Aznap 14:30-ig adható le rendelés."
    },
    {
      question: "Mennyi a várható átfutás?",
      answer: "Átlagosan 15–25 perc."
    },
    {
      question: "Van kártyás fizetés?",
      answer: "Igen, a helyszínen és online is (hamarosan)."
    },
    {
      question: "Számla kérhető?",
      answer: "Igen, kérlek jelezd rendeléskor."
    },
    {
      question: "Tudok időpontra kérni átvételt?",
      answer: "Igen, választhatsz idősávot."
    }
  ];

  useEffect(() => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <section className="py-8 md:py-16" ref={ref}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl md:text-3xl font-bold text-center text-foreground mb-6 md:mb-8">
          Gyakori kérdések
        </h2>
        
        <div className={cn(
          "bg-card rounded-2xl shadow-md border-0 p-4 md:p-6 transition-all duration-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-border/50">
                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary story-link transition-colors duration-200">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
