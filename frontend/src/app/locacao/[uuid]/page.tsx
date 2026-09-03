"use client";

import React, { useState, useEffect, use } from "react";
import {
  Calendar,
  MapPin,
  Package,
  User,
  CheckCircle2,
  Castle,
  AlertCircle,
  Phone,
  Sparkles,
  Clock,
  Building2,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { Locacao } from "@/types";
import { formatCurrency, formatTitleCase, formatDateTimeBR } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent } from "@/components/ui/card";

interface PublicLocacaoProps {
  params: Promise<{
    uuid: string;
  }>;
}

export default function PublicLocacaoPage({ params }: PublicLocacaoProps) {
  const { uuid } = use(params);
  const [locacao, setLocacao] = useState<Locacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPublicLocacao = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/locacoes/publica/${uuid}/`);
        if (response.ok) {
          const data = await response.json();
          setLocacao(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Erro ao buscar locação pública:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicLocacao();
  }, [uuid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground p-4">
        <div className="flex h-16 w-16 animate-bounce items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/30">
          <Castle className="h-8 w-8" />
        </div>
        <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">
          Carregando informações da locação...
        </p>
      </div>
    );
  }

  if (error || !locacao) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4 rounded-3xl border-destructive/30">
          <AlertCircle size={48} className="text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">
            Locação não encontrada
          </h1>
          <p className="text-sm text-muted-foreground">
            O link pode estar expirado ou incorreto. Por favor, verifique com o responsável.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4 flex flex-col items-center">
      <div className="w-full max-w-2xl flex justify-end mb-4">
        <ThemeToggle />
      </div>

      <div className="max-w-2xl w-full space-y-6">
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="bg-emerald-500/10 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-3 border border-emerald-500/20 text-emerald-500">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center justify-center gap-2">
            Resumo da Locação
            <Sparkles className="h-4 w-4 text-amber-500" />
          </h1>
          <p className="text-muted-foreground font-medium text-sm">
            Informações e detalhes confirmados da sua reserva
          </p>
        </div>

        {/* Main Card */}
        <Card className="rounded-[2.5rem] border-border/80 bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden">
          <CardContent className="p-6 sm:p-8 space-y-8">
            {/* Header Cliente & Total */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border/70 pb-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                  Cliente Contratante
                </p>
                <div className="flex items-center gap-2">
                  <User size={20} className="text-muted-foreground" />
                  <h2 className="text-2xl font-bold text-foreground">
                    {locacao.cliente.nome}
                  </h2>
                </div>
              </div>
              <div className="sm:text-right space-y-1 p-3 sm:p-0 rounded-2xl">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                  Valor Total
                </p>
                <p className="text-3xl font-black text-emerald-500 font-mono">
                  {formatCurrency(locacao.valor_total)}
                </p>
              </div>
            </div>

            {/* Grid Detalhes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Horários */}
              <div className="bg-muted/40 p-5 rounded-3xl border border-border/50 space-y-3">
                <div className="flex items-center gap-2 text-indigo-500">
                  <Clock size={18} />
                  <p className="text-xs font-bold uppercase tracking-wider">
                    Cronograma
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montagem:</span>
                    <span className="font-bold text-foreground">
                      {formatDateTimeBR(locacao.data_montagem)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Devolução:</span>
                    <span className="font-bold text-foreground">
                      {formatDateTimeBR(locacao.data_devolucao)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Local */}
              <div className="bg-muted/40 p-5 rounded-3xl border border-border/50 space-y-3">
                <div className="flex items-center gap-2 text-rose-500">
                  <MapPin size={18} />
                  <p className="text-xs font-bold uppercase tracking-wider">
                    Local do Evento
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-foreground text-sm leading-relaxed">
                    {locacao.endereco.rua}, {locacao.endereco.numero}
                  </p>
                  <p className="text-muted-foreground text-xs font-medium uppercase">
                    {locacao.endereco.bairro ? `${locacao.endereco.bairro} - ` : ""}
                    {locacao.endereco.cidade}
                  </p>
                  {locacao.endereco.complemento && (
                    <p className="text-xs text-muted-foreground italic">
                      Obs: {locacao.endereco.complemento}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Brinquedos */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-500">
                <Package size={18} />
                <p className="text-xs font-bold uppercase tracking-wider">
                  Itens Contratados ({locacao.brinquedos?.length || 0})
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {locacao.brinquedos?.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 bg-muted/40 p-4 rounded-2xl border border-border/50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-500 border border-indigo-500/20">
                      <Castle size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
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
          </CardContent>

          <div className="bg-indigo-600/10 p-5 border-t border-border/70 text-center">
            <p className="text-xs text-indigo-500 font-bold uppercase tracking-widest">
              Obrigado pela confiança! Em caso de dúvidas, fale com a equipe.
            </p>
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Gerenciamento Locação &copy; {new Date().getFullYear()} — Plataforma de Gestão de Locações.
        </p>
      </div>
    </div>
  );
}
