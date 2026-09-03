"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  MapPin,
  Calendar,
  Package,
  Search,
  Clock,
  Navigation,
  Sparkles,
  Layers,
  Map as MapIcon,
  List,
  CheckCircle2,
  CalendarDays,
  Truck,
  RotateCcw,
} from "lucide-react";
import authFetch from "@/lib/api";
import { Locacao } from "@/types";
import { formatCurrency, formatDateTimeBR, formatTitleCase } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RouteButton } from "@/components/map/route-button";
import { DynamicDeliveryMap } from "@/components/map/dynamic-delivery-map";
import { formatFullAddress } from "@/lib/geo";

type DateFilter = "hoje" | "amanha" | "7dias" | "ativas" | "todas";
type TypeFilter = "todas" | "montagens" | "devolucoes";

export default function MapaEntregasPage() {
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("ativas");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("todas");
  const [selectedLocacaoId, setSelectedLocacaoId] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<"split" | "map" | "list">("split");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/locacoes/todas");
      if (res.ok) {
        const data: Locacao[] = await res.json();
        const ativas = data.filter((l) => !l.cancelada);
        // Order by montagem date
        ativas.sort(
          (a, b) =>
            new Date(a.data_montagem).getTime() -
            new Date(b.data_montagem).getTime()
        );
        setLocacoes(ativas);
      }
    } catch (error) {
      console.error("Erro ao carregar locações para o mapa:", error);
      toast.error("Erro ao carregar mapa de entregas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter logic
  const filteredLocacoes = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);

    const proximaSemana = new Date(hoje);
    proximaSemana.setDate(hoje.getDate() + 7);

    return locacoes.filter((loc) => {
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const clienteNome = loc.cliente?.nome?.toLowerCase() || "";
        const enderecoStr = formatFullAddress(loc.endereco).toLowerCase();
        const brinquedosStr =
          loc.brinquedos?.map((b) => b.tipo.toLowerCase()).join(" ") || "";

        if (
          !clienteNome.includes(term) &&
          !enderecoStr.includes(term) &&
          !brinquedosStr.includes(term)
        ) {
          return false;
        }
      }

      const dMontagem = loc.data_montagem ? new Date(loc.data_montagem) : null;
      const dDevolucao = loc.data_devolucao ? new Date(loc.data_devolucao) : null;

      const dMontagemDate = dMontagem ? new Date(dMontagem).setHours(0, 0, 0, 0) : null;
      const dDevolucaoDate = dDevolucao ? new Date(dDevolucao).setHours(0, 0, 0, 0) : null;
      const hojeTime = hoje.getTime();
      const amanhaTime = amanha.getTime();
      const semanaTime = proximaSemana.getTime();

      // Date Filter
      if (dateFilter === "hoje") {
        const isMontagemHoje = dMontagemDate === hojeTime;
        const isDevolucaoHoje = dDevolucaoDate === hojeTime;
        if (!isMontagemHoje && !isDevolucaoHoje) return false;
      } else if (dateFilter === "amanha") {
        const isMontagemAmanha = dMontagemDate === amanhaTime;
        const isDevolucaoAmanha = dDevolucaoDate === amanhaTime;
        if (!isMontagemAmanha && !isDevolucaoAmanha) return false;
      } else if (dateFilter === "7dias") {
        const dentroPrazo =
          (dMontagemDate && dMontagemDate >= hojeTime && dMontagemDate <= semanaTime) ||
          (dDevolucaoDate && dDevolucaoDate >= hojeTime && dDevolucaoDate <= semanaTime);
        if (!dentroPrazo) return false;
      } else if (dateFilter === "ativas") {
        if (dDevolucao && dDevolucao < hoje) return false;
      }

      // Type Filter
      if (typeFilter === "montagens") {
        if (dateFilter === "hoje" && dMontagemDate !== hojeTime) return false;
        if (dateFilter === "amanha" && dMontagemDate !== amanhaTime) return false;
      } else if (typeFilter === "devolucoes") {
        if (dateFilter === "hoje" && dDevolucaoDate !== hojeTime) return false;
        if (dateFilter === "amanha" && dDevolucaoDate !== amanhaTime) return false;
      }

      return true;
    });
  }, [locacoes, searchTerm, dateFilter, typeFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredLocacoes.length;
    const montagensHoje = locacoes.filter((l) => {
      const d = l.data_montagem ? new Date(l.data_montagem).setHours(0, 0, 0, 0) : 0;
      const h = new Date().setHours(0, 0, 0, 0);
      return d === h;
    }).length;

    const devolucoesHoje = locacoes.filter((l) => {
      const d = l.data_devolucao ? new Date(l.data_devolucao).setHours(0, 0, 0, 0) : 0;
      const h = new Date().setHours(0, 0, 0, 0);
      return d === h;
    }).length;

    const valorTotal = filteredLocacoes.reduce(
      (acc, curr) => acc + Number(curr.valor_total || 0),
      0
    );

    return { total, montagensHoje, devolucoesHoje, valorTotal };
  }, [filteredLocacoes, locacoes]);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Mapa de Entregas & Logística"
        description="Acompanhe a localização das festas, planeje rotas e visualize cronogramas no mapa interativo."
      />

      <main className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-4 animate-in fade-in duration-300 flex-1 flex flex-col">
        {/* KPI Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4 rounded-2xl bg-card border-border/70 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-600/10 text-indigo-500 flex items-center justify-center font-bold">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  No Filtro
                </p>
                <p className="text-xl font-black text-foreground">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-2xl bg-card border-border/70 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Montagens Hoje
                </p>
                <p className="text-xl font-black text-emerald-500">{stats.montagensHoje}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-2xl bg-card border-border/70 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Retiradas Hoje
                </p>
                <p className="text-xl font-black text-amber-500">{stats.devolucoesHoje}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-2xl bg-card border-border/70 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Faturamento Filtro
                </p>
                <p className="text-lg sm:text-xl font-mono font-black text-emerald-500">
                  {formatCurrency(stats.valorTotal)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters Controls */}
        <div className="bg-card border border-border/70 p-4 rounded-2xl shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
            {/* Date filter pills */}
            <div className="flex p-1 bg-muted/60 border border-border/70 rounded-xl overflow-x-auto gap-1">
              {[
                { id: "hoje", label: "Hoje" },
                { id: "amanha", label: "Amanhã" },
                { id: "7dias", label: "Próx. 7 Dias" },
                { id: "ativas", label: "Ativas / Futuras" },
                { id: "todas", label: "Todas" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setDateFilter(item.id as DateFilter)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                    dateFilter === item.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Search and Mobile Toggle */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filtrar por cliente, rua, brinquedo..."
                  className="pl-9 h-9 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Mobile View switcher */}
              <div className="flex md:hidden p-0.5 bg-muted rounded-xl border border-border">
                <Button
                  variant={mobileView === "list" ? "default" : "ghost"}
                  size="sm"
                  className="h-8 px-2.5 text-xs font-bold"
                  onClick={() => setMobileView("list")}
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={mobileView === "map" ? "default" : "ghost"}
                  size="sm"
                  className="h-8 px-2.5 text-xs font-bold"
                  onClick={() => setMobileView("map")}
                >
                  <MapIcon className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Split: List & Interactive Delivery Map */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 min-h-[550px]">
          {/* Left Column: Delivery Cards List */}
          <div
            className={`md:col-span-5 lg:col-span-4 flex flex-col space-y-3 overflow-y-auto max-h-[700px] pr-1 ${
              mobileView === "map" ? "hidden md:flex" : "flex"
            }`}
          >
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : filteredLocacoes.length > 0 ? (
              filteredLocacoes.map((loc) => {
                const isSelected = loc.id === selectedLocacaoId;
                return (
                  <Card
                    key={loc.id}
                    onClick={() => setSelectedLocacaoId(loc.id)}
                    className={`cursor-pointer transition-all rounded-2xl border ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-500/5 shadow-md ring-2 ring-indigo-500/20"
                        : "border-border/70 hover:border-primary/50 bg-card"
                    }`}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                            Cliente
                          </p>
                          <h4 className="font-bold text-sm text-foreground">
                            {loc.cliente?.nome || "Cliente"}
                          </h4>
                        </div>
                        <span className="font-mono font-bold text-sm text-emerald-500">
                          {formatCurrency(loc.valor_total)}
                        </span>
                      </div>

                      {/* Horários */}
                      <div className="space-y-1 bg-muted/40 p-2.5 rounded-xl border border-border/50 text-[11px]">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          <span>
                            <strong>Montagem:</strong> {formatDateTimeBR(loc.data_montagem)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <RotateCcw className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span>
                            <strong>Retirada:</strong> {formatDateTimeBR(loc.data_devolucao)}
                          </span>
                        </div>
                      </div>

                      {/* Endereço */}
                      <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <MapPin className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${loc.endereco?.rua ? "text-rose-500" : "text-amber-500"}`} />
                        <span className="truncate">
                          {loc.endereco?.rua ? formatFullAddress(loc.endereco) : "Endereço a definir"}
                        </span>
                      </div>

                      {/* Brinquedos e Botão de Rota */}
                      <div className="flex justify-between items-center pt-2 border-t border-border/60">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {loc.brinquedos?.slice(0, 2).map((b) => (
                            <Badge key={b.id} variant="secondary" className="text-[10px] py-0">
                              {formatTitleCase(b.tipo.replaceAll("-", " "))}
                            </Badge>
                          ))}
                          {(loc.brinquedos?.length || 0) > 2 && (
                            <Badge variant="outline" className="text-[10px] py-0">
                              +{(loc.brinquedos?.length || 0) - 2}
                            </Badge>
                          )}
                        </div>

                        {loc.endereco?.rua && <RouteButton endereco={loc.endereco} size="sm" />}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="p-8 text-center border-dashed rounded-2xl">
                <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-xs font-bold text-foreground">Nenhuma locação encontrada</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Ajuste os filtros de data ou busca para visualizar as entregas.
                </p>
              </Card>
            )}
          </div>

          {/* Right Column: Full Leaflet Logistics Map */}
          <div
            className={`md:col-span-7 lg:col-span-8 h-full min-h-[480px] ${
              mobileView === "list" ? "hidden md:block" : "block"
            }`}
          >
            <DynamicDeliveryMap
              locacoes={filteredLocacoes}
              selectedLocacaoId={selectedLocacaoId}
              onSelectLocacao={(loc) => setSelectedLocacaoId(loc.id)}
              height="100%"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
