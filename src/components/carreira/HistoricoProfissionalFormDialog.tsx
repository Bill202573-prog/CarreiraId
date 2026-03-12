import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import type { HistoricoProfissional } from './HistoricoProfissionalSection';

const formSchema = z.object({
  instituicao: z.string().min(2, 'Informe a instituição'),
  cargo: z.string().min(2, 'Informe o cargo'),
  data_inicio: z.string().min(1, 'Informe a data de início'),
  data_fim: z.string().optional(),
  atual: z.boolean().default(false),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: HistoricoProfissional | null;
  onSave: (item: HistoricoProfissional) => void;
}

export function HistoricoProfissionalFormDialog({ open, onOpenChange, editing, onSave }: Props) {
  const [saving, setSaving] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      instituicao: '', cargo: '', data_inicio: '', data_fim: '', atual: false, observacoes: '',
    },
  });

  useEffect(() => {
    if (open && editing) {
      form.reset({
        instituicao: editing.instituicao,
        cargo: editing.cargo,
        data_inicio: editing.data_inicio,
        data_fim: editing.data_fim || '',
        atual: editing.atual,
        observacoes: editing.observacoes || '',
      });
    } else if (open) {
      form.reset({ instituicao: '', cargo: '', data_inicio: '', data_fim: '', atual: false, observacoes: '' });
    }
  }, [open, editing, form]);

  const isAtual = form.watch('atual');
  useEffect(() => {
    if (isAtual) form.setValue('data_fim', '');
  }, [isAtual, form]);

  const onSubmit = (data: FormData) => {
    setSaving(true);
    const item: HistoricoProfissional = {
      id: editing?.id || crypto.randomUUID(),
      instituicao: data.instituicao,
      cargo: data.cargo,
      data_inicio: data.data_inicio,
      data_fim: data.atual ? null : (data.data_fim || null),
      atual: data.atual,
      observacoes: data.observacoes || null,
    };
    onSave(item);
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Experiência' : 'Nova Experiência Profissional'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="instituicao" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Instituição *</FormLabel>
                <FormControl><Input placeholder="Ex: Flamengo, CT do Ninho" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="cargo" render={({ field }) => (
              <FormItem>
                <FormLabel>Cargo / Função *</FormLabel>
                <FormControl><Input placeholder="Ex: Técnico Sub-15, Scout" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="data_inicio" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Início *</FormLabel>
                  <FormControl><Input type="month" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="data_fim" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Fim</FormLabel>
                  <FormControl><Input type="month" {...field} disabled={isAtual} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="atual" render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0 cursor-pointer">Trabalho atualmente nesta instituição</FormLabel>
              </FormItem>
            )} />

            <FormField control={form.control} name="observacoes" render={({ field }) => (
              <FormItem>
                <FormLabel>Observações</FormLabel>
                <FormControl><Textarea {...field} placeholder="Conquistas, responsabilidades..." rows={3} /></FormControl>
              </FormItem>
            )} />

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editing ? 'Atualizar' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
