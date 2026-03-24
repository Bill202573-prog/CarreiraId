import { useQuery } from '@tanstack/react-query';

interface MunicipioIBGE {
  id: number;
  nome: string;
}

export function useCidadesPorEstado(uf: string | undefined) {
  return useQuery({
    queryKey: ['cidades-ibge', uf],
    queryFn: async (): Promise<string[]> => {
      if (!uf) return [];
      const res = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`
      );
      if (!res.ok) throw new Error('Erro ao buscar cidades');
      const data: MunicipioIBGE[] = await res.json();
      return data.map((m) => m.nome);
    },
    enabled: !!uf && uf.length === 2,
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });
}
