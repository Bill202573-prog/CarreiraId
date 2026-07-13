import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Star, Zap, Trophy, Copy, CheckCircle, Loader2, CreditCard, QrCode, Crown, ArrowLeft, ShieldCheck } from 'lucide-react';
import { CarreiraLimitResult } from '@/hooks/useCarreiraFreemium';
import { PLANOS, CarreiraPlano } from '@/config/carreiraPlanos';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface CarreiraPaywallProps {
  limitResult: CarreiraLimitResult;
  childName?: string;
  criancaId?: string;
  planoSelecionado?: string;
  onClose?: () => void;
  onSubscribed?: () => void;
}

type PaywallStep = 'info' | 'loading' | 'pix' | 'checking' | 'cartao-form' | 'cartao-processing' | 'success';
type PaymentMethod = 'pix' | 'cartao';

const formatCpf = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const formatCardNumber = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(.{4})/g, '$1 ').trim();
};

const formatExpiry = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const formatCep = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export function CarreiraPaywall({ limitResult, childName, criancaId, planoSelecionado, onClose, onSubscribed }: CarreiraPaywallProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<PaywallStep>('info');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cartao');
  const [cpfInput, setCpfInput] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<CarreiraPlano>(
    (planoSelecionado as CarreiraPlano) || 'competidor'
  );
  const [pixData, setPixData] = useState<{
    paymentId: string;
    subscriptionId: string;
    brCode: string;
    qrCodeImage: string;
    expiresAt: string;
    valor: number;
  } | null>(null);
  const [cardPollData, setCardPollData] = useState<{
    paymentId: string;
    subscriptionRecordId: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [, setPollCount] = useState(0);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCcv, setCardCcv] = useState('');
  const [cardCep, setCardCep] = useState('');
  const [cardAddressNumber, setCardAddressNumber] = useState('');
  const [cardPhone, setCardPhone] = useState('');
  const [cardSubmitting, setCardSubmitting] = useState(false);

  const cpfDigits = cpfInput.replace(/\D/g, '');
  const cpfValid = cpfDigits.length === 11;
  const planInfo = PLANOS[selectedPlan];
  const isElite = selectedPlan === 'elite';
  const isSandboxTest = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('asaas_sandbox') === '1';

  const resolveUser = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const sessionUser = sessionData.session?.user;
    return user || (sessionUser ? {
      id: sessionUser.id,
      name: sessionUser.user_metadata?.nome || sessionUser.user_metadata?.full_name || 'Usuário',
      email: sessionUser.email || '',
    } : null);
  };

  const generatePix = async () => {
    const cleanCpf = cpfInput.replace(/\D/g, '');
    const resolvedUser = await resolveUser();

    if (!resolvedUser || !criancaId || cleanCpf.length !== 11) {
      toast.error(!criancaId ? 'Atleta não identificado' : !resolvedUser ? 'Sessão expirada. Faça login novamente.' : 'Informe um CPF válido para gerar o pagamento');
      return;
    }

    setStep('loading');

    try {
      const { data, error } = await supabase.functions.invoke('generate-carreira-pix', {
        body: {
          user_id: resolvedUser.id,
          crianca_id: criancaId,
          cpf: cleanCpf,
          nome: resolvedUser.name,
          email: resolvedUser.email,
          plano: selectedPlan,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setPixData(data.data);
      setStep('pix');
    } catch (err: any) {
      console.error('Erro ao gerar PIX:', err);
      toast.error(err.message || 'Erro ao gerar pagamento PIX');
      setStep('info');
    }
  };

  const openCardForm = () => {
    if (!cpfValid) {
      toast.error('Informe um CPF válido');
      return;
    }
    if (!criancaId) {
      toast.error('Atleta não identificado');
      return;
    }
    setStep('cartao-form');
  };

  const submitCardSubscription = async () => {
    const cleanCpf = cpfInput.replace(/\D/g, '');
    const cleanNumber = cardNumber.replace(/\D/g, '');
    const cleanCep = cardCep.replace(/\D/g, '');
    const cleanPhone = cardPhone.replace(/\D/g, '');
    const [expMonth, expYear] = cardExpiry.split('/');

    // Client-side validation
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      toast.error('Número do cartão inválido');
      return;
    }
    if (!cardHolder.trim() || cardHolder.trim().length < 3) {
      toast.error('Informe o nome impresso no cartão');
      return;
    }
    if (!expMonth || !expYear || expMonth.length !== 2 || expYear.length !== 2) {
      toast.error('Validade inválida (use MM/AA)');
      return;
    }
    const monthNum = parseInt(expMonth, 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      toast.error('Mês de validade inválido');
      return;
    }
    if (cardCcv.length < 3 || cardCcv.length > 4) {
      toast.error('CVV inválido');
      return;
    }
    if (cleanCep.length !== 8) {
      toast.error('CEP inválido');
      return;
    }
    if (!cardAddressNumber.trim()) {
      toast.error('Informe o número do endereço');
      return;
    }
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      toast.error('Telefone inválido');
      return;
    }

    const resolvedUser = await resolveUser();
    if (!resolvedUser || !criancaId) {
      toast.error(!criancaId ? 'Atleta não identificado' : 'Sessão expirada. Faça login novamente.');
      return;
    }

    setCardSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-carreira-card-subscription', {
        body: {
          user_id: resolvedUser.id,
          crianca_id: criancaId,
          cpf: cleanCpf,
          nome: resolvedUser.name,
          email: resolvedUser.email,
          plano: selectedPlan,
          sandbox: isSandboxTest,
          card: {
            holderName: cardHolder.trim(),
            number: cleanNumber,
            expiryMonth: expMonth,
            expiryYear: expYear,
            ccv: cardCcv,
          },
          holderInfo: {
            name: resolvedUser.name,
            email: resolvedUser.email,
            cpfCnpj: cleanCpf,
            postalCode: cleanCep,
            addressNumber: cardAddressNumber.trim(),
            phone: cleanPhone,
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const payload = data?.data;
      if (!payload) throw new Error('Resposta inválida do servidor');

      // Clear sensitive fields immediately after successful submission
      setCardNumber('');
      setCardCcv('');

      if (payload.status === 'approved') {
        setStep('success');
        toast.success('Assinatura ativada!');
        queryClient.invalidateQueries({ queryKey: ['carreira-plano'] });
        queryClient.invalidateQueries({ queryKey: ['carreira-atividade-limit'] });
        onSubscribed?.();
      } else if (payload.status === 'processing') {
        setCardPollData({
          paymentId: payload.paymentId,
          subscriptionRecordId: payload.subscriptionRecordId,
        });
        setStep('cartao-processing');
      } else {
        throw new Error('Status de pagamento desconhecido');
      }
    } catch (err: any) {
      console.error('Erro na assinatura por cartão:', err?.message || 'erro');
      toast.error(err?.message || 'Não foi possível processar o cartão. Tente novamente.');
      // Stay on cartao-form so user can retry / switch method
    } finally {
      setCardSubmitting(false);
    }
  };

  const handleSubscribe = () => {
    if (paymentMethod === 'pix') {
      generatePix();
    } else {
      openCardForm();
    }
  };

  const checkPayment = useCallback(async (overridePaymentId?: string, overrideSubId?: string) => {
    const paymentId = overridePaymentId || pixData?.paymentId || cardPollData?.paymentId;
    const subscriptionId = overrideSubId || pixData?.subscriptionId || cardPollData?.subscriptionRecordId || '';
    if (!paymentId) return false;

    try {
      const { data, error } = await supabase.functions.invoke('check-carreira-payment', {
        body: {
          payment_id: paymentId,
          subscription_id: subscriptionId,
          sandbox: isSandboxTest,
        },
      });

      if (error) throw error;

      if (data?.data?.isPaid) {
        setStep('success');
        toast.success('Pagamento confirmado! Assinatura ativada.');
        queryClient.invalidateQueries({ queryKey: ['carreira-plano'] });
        queryClient.invalidateQueries({ queryKey: ['carreira-atividade-limit'] });
        onSubscribed?.();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao verificar pagamento:', err);
      return false;
    }
  }, [pixData, cardPollData, onSubscribed, queryClient]);

  // Poll for PIX payment
  useEffect(() => {
    if (step !== 'pix' || !pixData) return;

    const interval = setInterval(async () => {
      setPollCount(prev => prev + 1);
      const paid = await checkPayment();
      if (paid) clearInterval(interval);
    }, 5000);

    return () => clearInterval(interval);
  }, [step, pixData, checkPayment]);

  // Poll for card recurring payment (processing state)
  useEffect(() => {
    if (step !== 'cartao-processing' || !cardPollData) return;

    const interval = setInterval(async () => {
      setPollCount(prev => prev + 1);
      const paid = await checkPayment();
      if (paid) clearInterval(interval);
    }, 5000);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      toast.info('Ainda confirmando... você pode verificar manualmente.');
    }, 10 * 60_000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [step, cardPollData, checkPayment]);

  const copyBrCode = () => {
    if (!pixData?.brCode) return;
    navigator.clipboard.writeText(pixData.brCode);
    setCopied(true);
    toast.success('Código PIX copiado!');
    setTimeout(() => setCopied(false), 3000);
  };

  if (step === 'success') {
    return (
      <div className="space-y-4 py-2 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Pagamento confirmado! 🎉</h3>
        <p className="text-sm text-muted-foreground">
          Obrigado pela confiança! O plano <strong className="text-foreground">{planInfo.nome}</strong> já está ativo{childName && <> para <strong className="text-foreground">{childName}</strong></>}.
        </p>
        <p className="text-xs text-muted-foreground">
          Todas as funcionalidades do plano já estão disponíveis.
        </p>
        {paymentMethod === 'pix' && (
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            💡 Em <strong>30 dias</strong> será gerado um novo PIX para renovação. Fique atento ao seu e-mail!
          </p>
        )}
        {paymentMethod === 'cartao' && (
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            💳 Sua assinatura é <strong>recorrente</strong>. A cobrança será feita automaticamente no seu cartão a cada mês.
          </p>
        )}
        {onClose && (
          <Button className="w-full" onClick={onClose}>
            Continuar
          </Button>
        )}
      </div>
    );
  }

  if (step === 'cartao-processing') {
    return (
      <div className="space-y-4 py-2 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Confirmando pagamento...</h3>
        <p className="text-sm text-muted-foreground">
          Estamos aguardando a confirmação do seu cartão. Isso costuma levar alguns segundos.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          Verificando automaticamente...
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={() => checkPayment()}>
          Verificar agora
        </Button>
      </div>
    );
  }

  if (step === 'checking') {
    return (
      <div className="space-y-4 py-2 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <CreditCard className="w-8 h-8 text-amber-600" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Aguardando pagamento</h3>
        <p className="text-sm text-muted-foreground">
          Estamos verificando automaticamente.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          Verificando pagamento...
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={() => checkPayment()}>
          Já paguei, verificar agora
        </Button>
        {onClose && (
          <Button variant="ghost" className="w-full" onClick={() => { setStep('info'); }}>
            Cancelar
          </Button>
        )}
      </div>
    );
  }

  if (step === 'pix' && pixData) {
    return (
      <div className="space-y-4 py-2">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-bold">Pague via PIX</h3>
          <p className="text-sm text-muted-foreground">
            Escaneie o QR Code ou copie o código abaixo
          </p>
        </div>

        <div className="flex justify-center">
          <img
            src={pixData.qrCodeImage}
            alt="QR Code PIX"
            className="w-48 h-48 rounded-lg border"
          />
        </div>

        <div className="text-center">
          <span className="text-2xl font-bold text-primary">
            R$ {pixData.valor.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-sm text-muted-foreground block">pagamento único • 30 dias de acesso</span>
        </div>

        <Button variant="outline" className="w-full gap-2" onClick={copyBrCode}>
          {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copiado!' : 'Copiar código PIX'}
        </Button>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          Aguardando pagamento...
        </div>

        <Button variant="ghost" size="sm" className="w-full" onClick={() => checkPayment()}>
          Já paguei, verificar agora
        </Button>

        {onClose && (
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Cancelar
          </Button>
        )}
      </div>
    );
  }

  if (step === 'cartao-form') {
    const preco = planInfo.preco;
    return (
      <div className="space-y-4 py-2 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setStep('info')} disabled={cardSubmitting}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h3 className="text-base font-bold">Dados do cartão</h3>
            <p className="text-xs text-muted-foreground">
              Assinatura recorrente de R$ {preco.toFixed(2).replace('.', ',')}/mês
            </p>
            {isSandboxTest && (
              <Badge variant="outline" className="mt-1.5 text-[10px] border-amber-500/50 text-amber-600 bg-amber-500/10">
                🧪 Modo teste (sandbox)
              </Badge>
            )}
          </div>
        </div>

        <Card className="border" style={{ borderColor: `${planInfo.cor}30` }}>
          <CardContent className="pt-4 pb-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="card-number" className="text-xs">Número do cartão</Label>
              <Input
                id="card-number"
                placeholder="0000 0000 0000 0000"
                inputMode="numeric"
                autoComplete="cc-number"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={23}
                disabled={cardSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="card-holder" className="text-xs">Nome impresso no cartão</Label>
              <Input
                id="card-holder"
                placeholder="Como está no cartão"
                autoComplete="cc-name"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                disabled={cardSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="card-expiry" className="text-xs">Validade (MM/AA)</Label>
                <Input
                  id="card-expiry"
                  placeholder="MM/AA"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                  maxLength={5}
                  disabled={cardSubmitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="card-ccv" className="text-xs">CVV</Label>
                <Input
                  id="card-ccv"
                  placeholder="000"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  value={cardCcv}
                  onChange={(e) => setCardCcv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  disabled={cardSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="card-cep" className="text-xs">CEP</Label>
                <Input
                  id="card-cep"
                  placeholder="00000-000"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  value={cardCep}
                  onChange={(e) => setCardCep(formatCep(e.target.value))}
                  maxLength={9}
                  disabled={cardSubmitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="card-addr-num" className="text-xs">Número</Label>
                <Input
                  id="card-addr-num"
                  placeholder="123"
                  value={cardAddressNumber}
                  onChange={(e) => setCardAddressNumber(e.target.value.slice(0, 10))}
                  disabled={cardSubmitting}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="card-phone" className="text-xs">Telefone (com DDD)</Label>
              <Input
                id="card-phone"
                placeholder="(00) 00000-0000"
                inputMode="tel"
                autoComplete="tel"
                value={cardPhone}
                onChange={(e) => setCardPhone(formatPhone(e.target.value))}
                maxLength={15}
                disabled={cardSubmitting}
              />
            </div>

            <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-muted/30 rounded-md p-2">
              <ShieldCheck className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>Dados enviados de forma segura para nosso provedor de pagamentos. Não armazenamos seu cartão.</span>
            </div>

            <Button
              type="button"
              className="w-full text-white gap-2"
              style={{ backgroundColor: planInfo.cor }}
              onClick={submitCardSubscription}
              disabled={cardSubmitting}
            >
              {cardSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Assinar por R$ {preco.toFixed(2).replace('.', ',')}/mês
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => { setPaymentMethod('pix'); setStep('info'); }}
              disabled={cardSubmitting}
            >
              Prefiro pagar via PIX
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const preco = planInfo.preco;

  return (
    <div className="space-y-4 py-2 max-h-[80vh] overflow-y-auto">
      {/* Header - only show limit info when there's a real limit */}
      {limitResult.limit > 0 && (
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${planInfo.cor}15` }}>
            <Lock className="w-7 h-7" style={{ color: planInfo.cor }} />
          </div>
          <h3 className="text-lg font-bold text-foreground">Limite atingido</h3>
          <p className="text-sm text-muted-foreground">
            Você já registrou <strong>{limitResult.count}</strong> de <strong>{limitResult.limit}</strong> atividades gratuitas
            {childName && <> para <strong>{childName}</strong></>}.
          </p>
        </div>
      )}
      {limitResult.limit === 0 && (
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${planInfo.cor}15` }}>
            <Trophy className="w-7 h-7" style={{ color: planInfo.cor }} />
          </div>
          <h3 className="text-lg font-bold text-foreground">Turbine o perfil{childName && <> de {childName}</>}</h3>
          <p className="text-sm text-muted-foreground">
            Escolha o plano ideal e desbloqueie recursos exclusivos.
          </p>
        </div>
      )}

      {/* Plan selector */}
      <div className="grid grid-cols-2 gap-2">
        {(['competidor', 'elite'] as CarreiraPlano[]).map((p) => {
          const info = PLANOS[p];
          const isSelected = selectedPlan === p;
          return (
            <button
              key={p}
              onClick={() => setSelectedPlan(p)}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                isSelected ? 'ring-1' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                borderColor: isSelected ? info.cor : 'transparent',
                backgroundColor: isSelected ? `${info.cor}08` : undefined,
              }}
            >
              <span className="text-lg">{info.icone}</span>
              <span className="text-sm font-bold">{info.nome}</span>
              <span className="text-xs font-semibold" style={{ color: info.cor }}>
                R$ {info.preco.toFixed(2).replace('.', ',')}/mês
              </span>
            </button>
          );
        })}
      </div>

      {/* Upgrade Card */}
      <Card className="border-2 bg-background text-foreground" style={{ borderColor: `${planInfo.cor}30` }}>
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="flex items-center gap-2">
            <Badge style={{ backgroundColor: planInfo.cor }} className="text-white">
              {isElite ? <Crown className="w-3 h-3 mr-1" /> : <Star className="w-3 h-3 mr-1" />}
              {planInfo.nome}
            </Badge>
          </div>

          <ul className="space-y-1.5 text-sm">
            {planInfo.destaques.slice(0, 5).map((d, i) => (
              <li key={i} className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 flex-shrink-0" style={{ color: planInfo.cor }} />
                <span className="text-foreground">{d}</span>
              </li>
            ))}
          </ul>

          {/* CPF Input */}
          <div className="space-y-1.5">
            <Label htmlFor="cpf-paywall" className="text-xs font-medium text-foreground">CPF do responsável</Label>
            <Input
              id="cpf-paywall"
              placeholder="000.000.000-00"
              value={cpfInput}
              onChange={(e) => setCpfInput(formatCpf(e.target.value))}
              maxLength={14}
              className="text-sm"
            />
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Forma de pagamento</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cartao')}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-all ${
                  paymentMethod === 'cartao'
                    ? 'ring-1 border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <CreditCard className="w-4 h-4 flex-shrink-0" />
                <div className="text-left">
                  <div>Cartão</div>
                  <div className="text-[10px] font-normal text-muted-foreground">Recorrente</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-all ${
                  paymentMethod === 'pix'
                    ? 'ring-1 border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <QrCode className="w-4 h-4 flex-shrink-0" />
                <div className="text-left">
                  <div>PIX</div>
                  <div className="text-[10px] font-normal text-muted-foreground">30 dias</div>
                </div>
              </button>
            </div>
          </div>

          <Button
            type="button"
            className="w-full text-white gap-2"
            style={{ backgroundColor: planInfo.cor }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSubscribe();
            }}
            disabled={step === 'loading' || !cpfValid}
          >
            {step === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : paymentMethod === 'cartao' ? (
              <CreditCard className="w-4 h-4" />
            ) : (
              <QrCode className="w-4 h-4" />
            )}
            {step === 'loading'
              ? 'Processando...'
              : paymentMethod === 'cartao'
                ? `Assinar por R$ ${preco.toFixed(2).replace('.', ',')}/mês`
                : `Pagar R$ ${preco.toFixed(2).replace('.', ',')} via PIX`}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            {paymentMethod === 'cartao'
              ? 'Cartão de crédito • Cobrança mensal automática • Cancele quando quiser'
              : 'Pagamento via PIX • 30 dias de acesso • Cancele quando quiser'}
          </p>
        </CardContent>
      </Card>

      {onClose && (
        <Button variant="ghost" className="w-full" onClick={onClose}>
          Voltar
        </Button>
      )}
    </div>
  );
}
