import { useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useScrollFadeIn } from "@/hooks/useScrollFadeIn";
import { cn } from "@/lib/utils";
import { useFaqItems } from "@/hooks/useFaqItems";

const FAQSection = () => {
  const { ref, isVisible } = useScrollFadeIn();
  const { faqs, isLoading } = useFaqItems();

  useEffect(() => {
    if (!faqs.length) return;
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
  }, [faqs]);

  if (isLoading || !faqs.length) return null;

  return (
    <section className="py-8 md:py-16" ref={ref}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <span className="section-kicker">Hasznos tudnivalók</span>
        <h2 className="section-title mb-6 md:mb-8">Gyakori kérdések</h2>
        
        <div className={cn(
           "border-y border-border/60 bg-transparent p-1 md:p-2 transition-all duration-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.id || index} value={`item-${faq.id || index}`} className="border-border/50">
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
