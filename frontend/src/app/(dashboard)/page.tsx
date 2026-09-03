"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  MapPin,
  Package,
  Clock,
  Castle,
  User,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowRight,
  Phone,
  MessageCircle,
} from "lucide-react";
import authFetch from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Locacao } from "@/types";
import { formatCurrency, formatTitleCase, formatDateTimeBR } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function HomePage() {
  const { username } = useAuth();
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [selectedLoc, setSelectedLoc] = useState<Locacao | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [locacoesDoDia, setLocacoesDoDia] = useState<Locacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocacoes = async () => {
      try {
        const response = await authFetch("/locacoes");
        if (response.ok) {
          const data: Locacao[] = await response.json();
          setLocacoes(data);
        }
      } catch (error) {
        console.error("Erro ao buscar locações:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocacoes();
  }, []);

  const locacoesProximas = locacoes
    .filter((loc) => {
      if (loc.cancelada) return false;
      return loc.data_devolucao
        ? new Date(loc.data_devolucao) >= new Date()
        : true;
    })
    .slice(0, 3);

  const openDetails = (loc: Locacao) => {
    setSelectedLoc(loc);
    setIsDetailsOpen(true);
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + offset,
      1
    );
    setCurrentDate(newDate);
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const handleDiaClick = (dia: number | null) => {
    if (!dia) return;

    const filtradas = locacoes.filter((loc) => {
      if (loc.cancelada) return false;
      const dMontagem = new Date(loc.data_montagem);
      const dDesmontagem = new Date(loc.data_devolucao);
      return (
        (dMontagem.getDate() === dia &&
          dMontagem.getMonth() === currentDate.getMonth() &&
          dMontagem.getFullYear() === currentDate.getFullYear()) ||
        (dDesmontagem.getDate() === dia &&
          dDesmontagem.getMonth() === currentDate.getMonth() &&
          dDesmontagem.getFullYear() === currentDate.getFullYear())
      );
    });

    setLocacoesDoDia(filtradas);
    setIsDayModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title={`Olá, ${username ? formatTitleCase(username) : "Bem-vindo"}!`}
        description="Acompanhe suas locações agendadas e organize a agenda de eventos."
      />

      <main className="p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
        {/* Quick action hero */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-indigo-600/20">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black">
              Painel de Locações
            </h2>
            <p className="text-indigo-100 text-sm">
              Você possui{" "}
              <span className="font-bold underline">
                {locacoesProximas.length}
              </span>{" "}
              locação(ões) próximas aguardando montagem.
            </p>
          </div>
          <Link href="/locacoes">
            <Button
              variant="secondary"
              className="bg-white text-indigo-900 hover:bg-white/90 font-bold rounded-2xl h-11 px-6 shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" /> Nova Locação
            </Button>
          </Link>
        </div>

        {/* 2 Column Layout: Próximas Locações & Calendário */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Próximas Locações */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <MapPin className="h-5 w-5 text-indigo-500" /> Próximas Locações
              </h3>
              <Link
                href="/locacoes"
                className="text-xs font-bold text-indigo-500 hover:underline flex items-center gap-1"
              >
                Ver todas <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-28 rounded-3xl bg-muted animate-pulse"
                  />
                ))}
              </div>
            ) : locacoesProximas.length > 0 ? (
              <div className="space-y-3">
                {locacoesProximas.map((loc) => (
                  <Card
                    key={loc.id}
                    onClick={() => openDetails(loc)}
                    className="cursor-pointer hover:border-primary/50 transition-all group overflow-hidden"
                  >
                    <CardContent className="p-5 flex justify-between items-center">
                      <div className="space-y-1.5 flex-1 pr-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="info">
                            {new Date(loc.data_montagem).toLocaleDateString(
                              "pt-BR",
                              { day: "2-digit", month: "short" }
                            )}
                          </Badge>
                          <span className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                            {loc.cliente.nome}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {loc.endereco?.rua ? (
                            `${loc.endereco.rua}, ${loc.endereco.numero} • ${loc.endereco.cidade}`
                          ) : (
                            <span className="text-amber-500 font-semibold">
                              Endereço a definir
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3 text-indigo-500" />
                          <span>
                            {new Date(loc.data_montagem).toLocaleTimeString(
                              "pt-BR",
                              { hour: "2-digit", minute: "2-digit" }
                            )}{" "}
                            às{" "}
                            {new Date(loc.data_devolucao).toLocaleTimeString(
                              "pt-BR",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-500 text-lg">
                          {formatCurrency(loc.valor_total)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center border-dashed">
                <Package className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-muted-foreground">
                  Nenhuma locação agendada no momento.
                </p>
              </Card>
            )}
          </div>

          {/* Calendário Interativo */}
          <div className="lg:col-span-6 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
              <CalendarIcon className="h-5 w-5 text-indigo-500" /> Calendário de
              Eventos
            </h3>

            <Card className="p-5">
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-base text-foreground capitalize">
                  {currentDate.toLocaleDateString("pt-BR", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => changeMonth(-1)}
                    className="h-8 w-8 rounded-lg"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => changeMonth(1)}
                    className="h-8 w-8 rounded-lg"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-7 text-center text-[11px] font-bold text-muted-foreground mb-3">
                <div>DOM</div>
                <div>SEG</div>
                <div>TER</div>
                <div>QUA</div>
                <div>QUI</div>
                <div>SEX</div>
                <div>SÁB</div>
              </div>

              <div className="grid grid-cols-7 text-center gap-1.5">
                {generateCalendarDays().map((dia, i) => {
                  if (dia === null) {
                    return <div key={`empty-${i}`} className="p-3" />;
                  }

                  const possuiMontagem = locacoes.some((loc) => {
                    if (loc.cancelada) return false;
                    const d = new Date(loc.data_montagem);
                    return (
                      d.getDate() === dia &&
                      d.getMonth() === currentDate.getMonth() &&
                      d.getFullYear() === currentDate.getFullYear()
                    );
                  });

                  const possuiDesmontagem = locacoes.some((loc) => {
                    if (loc.cancelada) return false;
                    const d = new Date(loc.data_devolucao);
                    return (
                      d.getDate() === dia &&
                      d.getMonth() === currentDate.getMonth() &&
                      d.getFullYear() === currentDate.getFullYear()
                    );
                  });

                  const isHoje =
                    new Date().getDate() === dia &&
                    new Date().getMonth() === currentDate.getMonth() &&
                    new Date().getFullYear() === currentDate.getFullYear();

                  return (
                    <button
                      key={i}
                      onClick={() => handleDiaClick(dia)}
                      className={`relative py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer flex flex-col items-center justify-center min-h-[44px]
                        ${
                          isHoje
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                            : "hover:bg-muted text-foreground"
                        }
                        ${
                          possuiMontagem && !isHoje
                            ? "border border-indigo-500/40 bg-indigo-500/10 text-indigo-500 font-bold"
                            : ""
                        }
                      `}
                    >
                      {dia}
                      <div className="flex gap-0.5 mt-0.5">
                        {possuiMontagem && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        )}
                        {possuiDesmontagem && !possuiMontagem && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-border/70 flex items-center justify-center gap-6 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span>Montagem</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Devolução</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Modal Detalhes da Locação */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedLoc && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle className="text-xl font-black flex items-center gap-2 text-foreground">
                  <Package className="text-indigo-500 h-5 w-5" /> Detalhes da
                  Locação
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/40 p-4 rounded-2xl border border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">
                    Cliente
                  </p>
                  <p className="text-foreground font-bold text-lg leading-tight">
                    {selectedLoc.cliente.nome}
                  </p>
                </div>

                <div className="bg-muted/40 p-4 rounded-2xl border border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">
                    Valor Total
                  </p>
                  <p className="font-bold text-emerald-500 font-mono text-lg">
                    {formatCurrency(selectedLoc.valor_total)}
                  </p>
                </div>
              </div>

              {selectedLoc.cliente.numero_celular && (
                <a
                  href={`https://wa.me/55${selectedLoc.cliente.numero_celular.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 p-4 rounded-2xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500 text-white p-2 rounded-xl">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-500">
                        Conversar no WhatsApp
                      </p>
                      <p className="text-xs font-medium text-foreground">
                        {selectedLoc.cliente.numero_celular}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-emerald-500" />
                </a>
              )}

              {/* Endereço */}
              <div className="space-y-1.5 bg-muted/40 p-4 rounded-2xl border border-border/50">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MapPin className={`h-3.5 w-3.5 ${selectedLoc.endereco?.rua ? "text-rose-500" : "text-amber-500"}`} /> Local de
                  Montagem
                </p>
                {selectedLoc.endereco?.rua ? (
                  <>
                    <p className="text-sm font-bold text-foreground">
                      {selectedLoc.endereco.rua}, {selectedLoc.endereco.numero}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedLoc.endereco.bairro
                        ? `${selectedLoc.endereco.bairro}, `
                        : ""}
                      {selectedLoc.endereco.cidade}
                    </p>
                  </>
                ) : (
                  <p className="text-sm font-bold text-amber-500">
                    Endereço a definir
                  </p>
                )}
              </div>

              {/* Horários */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-2xl">
                  <p className="text-[10px] text-indigo-500 font-bold uppercase">
                    Montagem
                  </p>
                  <p className="text-xs font-bold text-foreground mt-1">
                    {formatDateTimeBR(selectedLoc.data_montagem)}
                  </p>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl">
                  <p className="text-[10px] text-rose-500 font-bold uppercase">
                    Retirada
                  </p>
                  <p className="text-xs font-bold text-foreground mt-1">
                    {formatDateTimeBR(selectedLoc.data_devolucao)}
                  </p>
                </div>
              </div>

              {/* Brinquedos */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Brinquedos ({selectedLoc.brinquedos?.length || 0})
                </p>
                <div className="grid gap-2">
                  {selectedLoc.brinquedos?.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-3 bg-muted/40 p-3 rounded-2xl border border-border/50"
                    >
                      <Castle className="h-4 w-4 text-indigo-500" />
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          {formatTitleCase(b.tipo.replaceAll("-", " "))}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Patrimônio #{b.id}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                  className="rounded-xl w-full"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Locações do Dia */}
      <Dialog open={isDayModalOpen} onOpenChange={setIsDayModalOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Locações do Dia
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            {locacoesDoDia.length > 0 ? (
              locacoesDoDia.map((loc) => (
                <div
                  key={loc.id}
                  onClick={() => {
                    setIsDayModalOpen(false);
                    openDetails(loc);
                  }}
                  className="p-4 bg-muted/40 border border-border/60 rounded-2xl hover:border-primary transition-all cursor-pointer space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-sm text-foreground">
                      {loc.cliente.nome}
                    </p>
                    <span className="font-mono text-xs font-bold text-emerald-500">
                      {formatCurrency(loc.valor_total)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {loc.endereco?.rua
                      ? `${loc.endereco.rua}, ${loc.endereco.numero}`
                      : "Endereço a definir"}
                  </p>
                  <div className="flex justify-between text-[11px] font-medium pt-1 border-t border-border/40">
                    <span className="text-indigo-500">
                      Montagem:{" "}
                      {new Date(loc.data_montagem).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-rose-500">
                      Devolução:{" "}
                      {new Date(loc.data_devolucao).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-6">
                Nenhuma locação agendada para este dia.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
