import { Locacao } from "@/types";

export interface MonthlyStat {
  monthIndex: number;
  name: string;
  rendimento: number;
  total: number;
}

export interface ClientRanking {
  nome: string;
  total: number;
}

export interface ToyRanking {
  nome: string;
  total: number;
}

export const getTopClients = (data: Locacao[]): ClientRanking[] => {
  const counts: Record<string, number> = {};

  data
    .filter((loc) => !loc.cancelada && loc.cliente?.nome)
    .forEach((loc) => {
      const nome = loc.cliente.nome;
      counts[nome] = (counts[nome] || 0) + 1;
    });

  return Object.entries(counts)
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total);
};

export const getMonthlyStats = (data: Locacao[]): MonthlyStat[] => {
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const stats: Record<number, MonthlyStat> = {};

  data
    .filter((l) => !l.cancelada && l.data_montagem)
    .forEach((loc) => {
      const date = new Date(loc.data_montagem);
      const monthIndex = date.getMonth();
      const mName = months[monthIndex];
      if (!stats[monthIndex]) {
        stats[monthIndex] = { monthIndex, name: mName, rendimento: 0, total: 0 };
      }
      const valor = typeof loc.valor_total === "string" ? parseFloat(loc.valor_total) || 0 : loc.valor_total || 0;
      stats[monthIndex].rendimento += valor;
      stats[monthIndex].total += 1;
    });

  return Object.values(stats).sort((a, b) => a.monthIndex - b.monthIndex);
};

export const getToyRanking = (data: Locacao[]): ToyRanking[] => {
  const toyCount: Record<string, number> = {};

  data
    .filter((l) => !l.cancelada && Array.isArray(l.brinquedos))
    .forEach((l) => {
      l.brinquedos.forEach((b) => {
        if (b.tipo) {
          const name = b.tipo.replaceAll("-", " ");
          toyCount[name] = (toyCount[name] || 0) + 1;
        }
      });
    });

  return Object.entries(toyCount)
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total);
};
