import { useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useScrollFadeIn } from "@/hooks/useScrollFadeIn";
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
    <section className="py-10 md:py-14" ref={ref}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <span className="section-kicker">Hasznos tudnivalók</span>
        <h2 className="section-title mb-4 md:mb-6">Gyakori kérdések</h2>
        
        <div className={`border-y border-border/60 bg-transparent transition-transform duration-500 motion-reduce:transition-none ${isVisible ? "translate-y-0" : "translate-y-1"}`}>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.id || index} value={`item-${faq.id || index}`} className="border-border/50">
                <AccordionTrigger className="py-4 text-left font-semibold text-foreground transition-colors duration-200 hover:text-primary">
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
