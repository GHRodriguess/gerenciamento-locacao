"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  CalendarCheck,
  Ban,
  Users,
  Castle,
  ChevronRight,
} from "lucide-react";
import authFetch from "@/lib/api";
import { Locacao, DashboardMetrics } from "@/types";
import {
  getMonthlyStats,
  getTopClients,
  getToyRanking,
} from "@/lib/dashboard-utils";
import { formatCurrency, formatTitleCase } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DashboardAnalyticsPage() {
  const [data, setData] = useState<Locacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    activeLocacoes: 0,
    cancelRate: 0,
    lostRevenue: 0,
    topClient: { nome: "-", total: 0 },
    popularToy: "-",
  });

  const calculateMetrics = (locs: Locacao[]) => {
    const total = locs.length;
    const active = locs.filter((l) => !l.cancelada);
    const canceled = locs.filter((l) => l.cancelada);

    const revenue = active.reduce(
      (acc, curr) => acc + (parseFloat(String(curr.valor_total)) || 0),
      0
    );
    const lost = canceled.reduce(
      (acc, curr) => acc + (parseFloat(String(curr.valor_total)) || 0),
      0
    );

    const cancelRate =
      total > 0 ? ((canceled.length / total) * 100).toFixed(1) : 0;

    const clientsRanking = getTopClients(locs);
    const topClient =
      clientsRanking.length > 0
        ? clientsRanking[0]
        : { nome: "-", total: 0 };

    const toyCount: Record<string, number> = {};
    active.forEach((l) => {
      l.brinquedos?.forEach((b) => {
        if (b.tipo) {
          const name = b.tipo.replaceAll("-", " ");
          toyCount[name] = (toyCount[name] || 0) + 1;
        }
      });
    });

    const popularToyName = Object.keys(toyCount).reduce(
      (a, b) => (toyCount[a] > toyCount[b] ? a : b),
      "-"
    );

    setMetrics({
      totalRevenue: revenue,
      lostRevenue: lost,
      activeLocacoes: active.length,
      cancelRate: cancelRate,
      topClient: { nome: topClient.nome, total: topClient.total },
      popularToy: popularToyName,
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await authFetch("/locacoes/todas");
        if (response.ok) {
          const json: Locacao[] = await response.json();
          setData(json);
          calculateMetrics(json);
        }
      } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const monthlyStats = getMonthlyStats(data);
  const topClients = getTopClients(data);
  const toyRankings = getToyRanking(data);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Dashboard Analítico"
        description="Acompanhe o faturamento, volume de locações e brinquedos mais alugados."
      />

      <main className="p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
        {/* Metric Cards Grid com layout e tipografia fluidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Receita Total */}
          <Card className="hover:border-primary/50 transition-all overflow-hidden">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Receita Total
                </span>
                <DollarSign className="h-4 w-4 text-emerald-500 shrink-0" />
              </div>
              <p className="text-xl sm:text-2xl font-black font-mono text-emerald-500 truncate" title={formatCurrency(metrics.totalRevenue)}>
                {formatCurrency(metrics.totalRevenue)}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                Líquido arrecadado
              </p>
            </CardContent>
          </Card>

          {/* Cancelamento */}
          <Card className="hover:border-destructive/50 transition-all overflow-hidden">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Cancelamento
                </span>
                <Ban className="h-4 w-4 text-rose-500 shrink-0" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-rose-500 truncate">
                {metrics.cancelRate}%
              </p>
              <p className="text-[11px] text-muted-foreground truncate" title={`${formatCurrency(metrics.lostRevenue)} perdidos`}>
                {formatCurrency(metrics.lostRevenue)} perdidos
              </p>
            </CardContent>
          </Card>

          {/* Locações Ativas */}
          <Card className="hover:border-primary/50 transition-all overflow-hidden">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Locações
                </span>
                <CalendarCheck className="h-4 w-4 text-indigo-500 shrink-0" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-foreground truncate">
                {metrics.activeLocacoes}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                Eventos realizados
              </p>
            </CardContent>
          </Card>

          {/* Fidelidade */}
          <Card className="hover:border-primary/50 transition-all overflow-hidden">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Top Cliente
                </span>
                <Users className="h-4 w-4 text-amber-500 shrink-0" />
              </div>
              <p className="text-lg sm:text-xl font-bold text-foreground truncate" title={metrics.topClient.nome}>
                {metrics.topClient.nome.split(" ")[0]}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {metrics.topClient.total}{" "}
                {metrics.topClient.total === 1 ? "locação" : "locações"}
              </p>
            </CardContent>
          </Card>

          {/* Destaque */}
          <Card className="hover:border-primary/50 transition-all overflow-hidden sm:col-span-2 lg:col-span-1">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Destaque
                </span>
                <Castle className="h-4 w-4 text-indigo-500 shrink-0" />
              </div>
              <p className="text-lg sm:text-xl font-bold text-foreground truncate" title={metrics.popularToy}>
                {formatTitleCase(metrics.popularToy.split(" ")[0])}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                Mais pedido
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Analytics Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de Faturamento Mensal */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-500" /> Rendimentos e
                Volume Mensal
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72 w-full pt-4">
              {monthlyStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyStats}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      className="stroke-muted/30"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      tickFormatter={(val) => `R$ ${val}`}
                    />
                    <Tooltip
                      formatter={(value: any) => [
                        formatCurrency(value),
                        "Rendimento",
                      ]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "16px",
                        color: "hsl(var(--card-foreground))",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Bar
                      dataKey="rendimento"
                      fill="#6366f1"
                      radius={[8, 8, 0, 0]}
                      barSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  Dados insuficientes para exibição de gráfico.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Clientes */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" /> Top Clientes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topClients.slice(0, 5).map((client, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-2xl hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-500 font-bold text-xs border border-indigo-500/20">
                      {client.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">
                        {client.nome}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {client.total}{" "}
                        {client.total === 1 ? "reserva" : "reservas"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Brinquedos Populares */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Castle className="h-5 w-5 text-indigo-500" /> Brinquedos
                Populares
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {toyRankings.slice(0, 4).map((toy, idx) => {
                const maxTotal = toyRankings[0]?.total || 1;
                const percent = (toy.total / maxTotal) * 100;

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-foreground capitalize truncate pr-2">
                        {toy.nome}
                      </span>
                      <span className="font-mono font-bold text-indigo-500 shrink-0">
                        {toy.total}x
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Relatório Mensal em Tabela */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold">
                Relatório Mensal Consolidado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead className="text-center">Volume</TableHead>
                    <TableHead className="text-right">Faturamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyStats.map((m, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-foreground">
                        {m.name}
                      </TableCell>
                      <TableCell className="text-center font-mono text-muted-foreground">
                        {m.total} {m.total === 1 ? "locação" : "locações"}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-500">
                        {formatCurrency(m.rendimento)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
