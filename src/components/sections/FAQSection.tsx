import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQSection = () => {
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

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8">
          Gyakori kérdések
        </h2>
        
        <div className="bg-card rounded-2xl shadow-md border-0 p-6">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-border/50">
                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary">
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