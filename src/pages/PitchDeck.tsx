import { Button } from "@/components/ui/button";
import { Download, Presentation } from "lucide-react";
import { generatePitchDeckPDF } from "@/utils/pitchDeckPdf";
import { useNavigate } from "react-router-dom";

const slides = [
  { num: 1, title: "Cover", desc: "MEDMIND — AI-Powered Clinical Intelligence" },
  { num: 2, title: "Problem", desc: "Doctors lose 40% of their time to paperwork" },
  { num: 3, title: "Solution", desc: "AI Co-Pilot for clinical workflows" },
  { num: 4, title: "Product", desc: "12+ integrated modules" },
  { num: 5, title: "Market", desc: "$12B LatAm healthcare IT opportunity" },
  { num: 6, title: "Business Model", desc: "SaaS tiers: $29 / $79 / $149 per month" },
  { num: 7, title: "Traction", desc: "MVP live, all core modules operational" },
  { num: 8, title: "Roadmap", desc: "Launch → Scale → Expand → Dominate" },
  { num: 9, title: "Team", desc: "Healthcare + AI expertise" },
  { num: 10, title: "Vision & Ask", desc: "Pre-Seed $500K to transform LatAm healthcare" },
];

const PitchDeck = () => {
  const navigate = useNavigate();

  const handleDownload = () => {
    const doc = generatePitchDeckPDF();
    doc.save("MEDMIND_Pitch_Deck_2025.pdf");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Presentation className="h-8 w-8 text-primary" />
              MEDMIND Pitch Deck
            </h1>
            <p className="text-muted-foreground mt-1">10-slide investor presentation</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/")}>
              ← Back
            </Button>
            <Button onClick={handleDownload} size="lg" className="gap-2">
              <Download className="h-5 w-5" />
              Download PDF
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {slides.map((slide) => (
            <div
              key={slide.num}
              className="flex items-center gap-5 p-5 rounded-xl border border-border bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-lg">
                {slide.num}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{slide.title}</h3>
                <p className="text-sm text-muted-foreground">{slide.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Button onClick={handleDownload} size="lg" className="gap-2 px-8">
            <Download className="h-5 w-5" />
            Download Full Pitch Deck PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PitchDeck;
