import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Slide {
  emoji: string;
  titulo: string;
  descricao: string;
  detalhes: string[];
}

interface TutorialPreviewModalProps {
  open: boolean;
  onClose: () => void;
  tutorial: { titulo: string; slides: Slide[] };
}

export function TutorialPreviewModal({ open, onClose, tutorial }: TutorialPreviewModalProps) {
  const [step, setStep] = useState(0);
  const slides = tutorial.slides;
  if (!slides.length) return null;

  const slide = slides[step];
  const isLast = step === slides.length - 1;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md p-0 gap-0 border-0 bg-[hsl(220,14%,8%)] text-white overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[hsl(0,0%,95%)]">{tutorial.titulo}</h2>
            <button onClick={onClose} className="text-[hsl(0,0%,50%)] hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? '2rem' : '0.5rem',
                  backgroundColor: i === step
                    ? 'hsl(25 95% 55%)'
                    : i < step
                      ? 'hsl(25 95% 55% / 0.4)'
                      : 'hsl(0 0% 30%)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Slide content */}
        <div className="px-6 pb-2">
          <div
            className="rounded-xl p-6 min-h-[260px] flex flex-col"
            style={{
              backgroundColor: 'hsl(220 12% 10%)',
              border: '1px solid hsl(25 95% 55% / 0.15)',
            }}
          >
            <div className="text-center mb-4">
              <span className="text-4xl mb-2 block">{slide.emoji}</span>
              <div
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full mb-2"
                style={{ backgroundColor: 'hsl(25 95% 55% / 0.12)', color: 'hsl(25 95% 60%)' }}
              >
                Passo {step + 1} de {slides.length}
              </div>
              <h3 className="text-lg font-bold text-[hsl(0,0%,95%)]">{slide.titulo}</h3>
              <p className="text-sm mt-1 text-[hsl(0,0%,55%)]">{slide.descricao}</p>
            </div>

            <ul className="space-y-2.5 flex-1">
              {slide.detalhes.filter(Boolean).map((detail, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span
                    className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: 'hsl(200 100% 50% / 0.15)', color: 'hsl(200 90% 60%)' }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-[hsl(0,0%,85%)]">{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-6 pb-6 pt-3 flex items-center gap-3">
          {step > 0 && (
            <Button
              variant="outline"
              size="lg"
              className="gap-1 border-[hsl(220,10%,25%)] bg-transparent text-[hsl(0,0%,80%)] hover:bg-[hsl(220,10%,15%)]"
              onClick={() => setStep(step - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </Button>
          )}
          <Button
            size="lg"
            className="flex-1 gap-2"
            style={{ backgroundColor: 'hsl(25 95% 55%)', color: 'white' }}
            onClick={() => {
              if (isLast) onClose();
              else setStep(step + 1);
            }}
          >
            {isLast ? 'Concluir' : 'Próximo'}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
