import { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { usePwaInstall } from '@/hooks/usePwaInstall';

interface PwaInstallPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function detectDevice(): 'ios' | 'android' | 'desktop' {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

export function PwaInstallPopup({ open, onOpenChange }: PwaInstallPopupProps) {
  const { canInstall, isInstalled, install } = usePwaInstall();
  const [device] = useState(detectDevice);

  // If already installed, don't show
  if (isInstalled) return null;

  const handleInstallClick = async () => {
    await install();
    // On Android with prompt, dialog closes after install
    if (device === 'android') {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border" style={{ backgroundColor: 'hsl(220 15% 10%)', borderColor: 'hsl(220 10% 20%)', color: 'hsl(0 0% 95%)' }}>
        <DialogTitle className="sr-only">Instalar aplicativo</DialogTitle>
        <DialogDescription className="sr-only">Instruções para instalar o app</DialogDescription>

        <div className="text-center space-y-4 py-2">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center" style={{ backgroundColor: 'hsl(25 95% 55% / 0.15)' }}>
            <Smartphone className="w-8 h-8" style={{ color: 'hsl(25 95% 55%)' }} />
          </div>

          <div>
            <h3 className="text-lg font-bold" style={{ color: 'hsl(0 0% 95%)' }}>
              Instale o CARREIRA ID
            </h3>
            <p className="text-sm mt-1" style={{ color: 'hsl(0 0% 55%)' }}>
              Acesso rápido direto da sua tela inicial
            </p>
          </div>

          {device === 'ios' ? (
            <div className="space-y-3 text-left">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 text-sm font-bold" style={{ backgroundColor: 'hsl(25 95% 55% / 0.15)', color: 'hsl(25 95% 55%)' }}>
                  1
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'hsl(0 0% 90%)' }}>
                    Toque em <Share className="inline w-4 h-4 mb-0.5" /> <strong>Compartilhar</strong>
                  </p>
                  <p className="text-xs" style={{ color: 'hsl(0 0% 50%)' }}>Na barra inferior do Safari</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 text-sm font-bold" style={{ backgroundColor: 'hsl(25 95% 55% / 0.15)', color: 'hsl(25 95% 55%)' }}>
                  2
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'hsl(0 0% 90%)' }}>
                    Toque em <PlusSquare className="inline w-4 h-4 mb-0.5" /> <strong>Adicionar à Tela de Início</strong>
                  </p>
                  <p className="text-xs" style={{ color: 'hsl(0 0% 50%)' }}>Role o menu se necessário</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 text-sm font-bold" style={{ backgroundColor: 'hsl(25 95% 55% / 0.15)', color: 'hsl(25 95% 55%)' }}>
                  3
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'hsl(0 0% 90%)' }}>
                    Toque em <strong>"Adicionar"</strong>
                  </p>
                  <p className="text-xs" style={{ color: 'hsl(0 0% 50%)' }}>O app aparecerá na sua tela inicial</p>
                </div>
              </div>
            </div>
          ) : device === 'android' ? (
            <div className="space-y-3">
              <p className="text-sm" style={{ color: 'hsl(0 0% 70%)' }}>
                Toque no botão abaixo para instalar o aplicativo diretamente no seu celular.
              </p>
              {canInstall && (
                <Button
                  className="w-full gap-2 font-bold text-white"
                  size="lg"
                  style={{ backgroundColor: 'hsl(25 95% 55%)' }}
                  onClick={handleInstallClick}
                >
                  <Download className="w-5 h-5" />
                  Instalar Agora
                </Button>
              )}
              {!canInstall && (
                <div className="text-left space-y-2">
                  <p className="text-xs" style={{ color: 'hsl(0 0% 50%)' }}>
                    Se o botão não aparecer, use o menu do navegador (⋮) e toque em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'hsl(0 0% 60%)' }}>
              Abra este site no celular para instalar como aplicativo.
            </p>
          )}

          <Button
            variant="ghost"
            className="w-full text-sm"
            style={{ color: 'hsl(0 0% 50%)' }}
            onClick={() => onOpenChange(false)}
          >
            Agora não
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
