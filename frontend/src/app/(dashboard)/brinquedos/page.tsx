"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Castle,
  Plus,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import authFetch from "@/lib/api";
import { Brinquedo } from "@/types";
import { brinquedoSchema, BrinquedoFormData } from "@/schemas";
import { formatTitleCase } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const BRINQUEDO_TIPOS = [
  { value: "cama-elastica-2,49-metros", label: "Cama Elástica - 2,49 metros" },
  { value: "cama-elastica-3-metros", label: "Cama Elástica - 3 metros" },
  { value: "cama-elastica-5-metros", label: "Cama Elástica - 5 metros" },
  { value: "piscina-de-bolinhas", label: "Piscina de Bolinhas" },
];

export default function BrinquedosPage() {
  const [brinquedos, setBrinquedos] = useState<Brinquedo[]>([]);
  const [viewMode, setViewMode] = useState<"todos" | "disponibilidade">("todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [brinquedoToDelete, setBrinquedoToDelete] = useState<Brinquedo | null>(null);
  const [dates, setDates] = useState({ inicio: "", fim: "" });
  const [dateError, setDateError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BrinquedoFormData>({
    resolver: zodResolver(brinquedoSchema),
    defaultValues: {
      tipo: "cama-elastica-2,49-metros",
      ativo: true,
    },
  });

  const selectedTipo = watch("tipo");
  const isAtivo = watch("ativo");

  const fetchBrinquedos = async (urlSuffix = "/brinquedos/") => {
    setLoading(true);
    try {
      const response = await authFetch(urlSuffix);
      if (response.ok) {
        const data: Brinquedo[] = await response.json();
        setBrinquedos(data);
      }
    } catch (error) {
      console.error("Erro ao buscar brinquedos:", error);
      toast.error("Erro ao carregar lista de brinquedos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrinquedos();
  }, []);

  const formatWithTimezone = (dateString: string) => {
    if (!dateString) return "";
    return `${dateString}:00-03:00`;
  };

  const checkAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    setDateError("");
    if (!dates.inicio || !dates.fim) return;

    const inicioFormatado = formatWithTimezone(dates.inicio);
    const fimFormatado = formatWithTimezone(dates.fim);

    if (fimFormatado <= inicioFormatado) {
      setDateError("A data de devolução deve ser posterior à data de montagem.");
      return;
    }

    const query = `/brinquedos/disponiveis/?inicio=${inicioFormatado}&fim=${fimFormatado}`;
    fetchBrinquedos(query);
  };

  const onSubmit = async (data: BrinquedoFormData) => {
    setSubmitting(true);
    try {
      const response = await authFetch("/brinquedos/", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setIsModalOpen(false);
        reset({ tipo: "cama-elastica-2,49-metros", ativo: true });
        fetchBrinquedos();
        toast.success("Brinquedo cadastrado com sucesso!");
      } else {
        toast.error("Erro ao cadastrar brinquedo.");
      }
    } catch (error) {
      console.error("Erro ao criar brinquedo:", error);
      toast.error("Erro ao conectar com o servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!brinquedoToDelete) return;
    setSubmitting(true);
    try {
      const response = await authFetch(`/brinquedos/${brinquedoToDelete.id}/`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchBrinquedos();
        setIsDeleteModalOpen(false);
        toast.success("Brinquedo removido com sucesso.");
      } else {
        toast.error("Erro ao excluir brinquedo.");
      }
    } catch (error) {
      console.error("Erro ao deletar:", error);
      toast.error("Erro ao excluir brinquedo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Gestão de Brinquedos"
        description="Gerencie seu inventário de brinquedos e consulte disponibilidade para eventos."
      />

      <main className="p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
        {/* Switch mode & Action Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex p-1.5 bg-muted/60 border border-border/70 rounded-2xl max-w-md w-full">
            <button
              onClick={() => {
                setViewMode("todos");
                fetchBrinquedos("/brinquedos/");
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                viewMode === "todos"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Todos os Brinquedos
            </button>
            <button
              onClick={() => setViewMode("disponibilidade")}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                viewMode === "disponibilidade"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Consultar Disponibilidade
            </button>
          </div>

          <Button
            variant="indigo"
            onClick={() => setIsModalOpen(true)}
            className="rounded-2xl h-11 px-6 font-bold shadow-md"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Novo Brinquedo
          </Button>
        </div>

        {/* Disponibilidade Form */}
        {viewMode === "disponibilidade" && (
          <Card className="border-indigo-500/30 bg-indigo-500/5 animate-in slide-in-from-top-4 duration-300">
            <CardContent className="p-6">
              <form
                onSubmit={checkAvailability}
                className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end"
              >
                <div className="sm:col-span-5 space-y-2">
                  <Label htmlFor="inicio" className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-indigo-500" /> Início do Evento
                  </Label>
                  <Input
                    id="inicio"
                    type="datetime-local"
                    value={dates.inicio}
                    onChange={(e) => setDates({ ...dates, inicio: e.target.value })}
                    required
                  />
                </div>

                <div className="sm:col-span-5 space-y-2">
                  <Label htmlFor="fim" className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-rose-500" /> Fim do Evento
                  </Label>
                  <Input
                    id="fim"
                    type="datetime-local"
                    value={dates.fim}
                    onChange={(e) => setDates({ ...dates, fim: e.target.value })}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <Button type="submit" variant="indigo" className="w-full h-11 rounded-xl font-bold">
                    Consultar
                  </Button>
                </div>
              </form>

              {dateError && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{dateError}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Brinquedos List */}
        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : brinquedos.length > 0 ? (
          <div className="grid gap-3">
            {brinquedos.map((item) => (
              <Card
                key={item.id}
                className="hover:border-primary/40 transition-all overflow-hidden"
              >
                <CardContent className="p-4 sm:p-5 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-500 border border-indigo-500/20">
                      <Castle className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-foreground">
                        {formatTitleCase(item.tipo.replaceAll("-", " "))}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant={item.ativo ? "success" : "secondary"}
                          className="text-[10px]"
                        >
                          {item.ativo ? "Ativo no Sistema" : "Inativo"}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          Patrimônio #{item.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setBrinquedoToDelete(item);
                      setIsDeleteModalOpen(true);
                    }}
                    className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl"
                    title="Remover brinquedo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center border-dashed">
            <Castle className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-bold text-foreground">
              Nenhum brinquedo encontrado
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {viewMode === "disponibilidade"
                ? "Nenhum item livre para o período selecionado."
                : "Cadastre seu primeiro brinquedo para iniciar."}
            </p>
          </Card>
        )}
      </main>

      {/* Modal Criar Brinquedo */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Novo Brinquedo</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Tipo de Brinquedo</Label>
              <Select
                value={selectedTipo}
                onValueChange={(val) => setValue("tipo", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {BRINQUEDO_TIPOS.map((b) => (
                    <SelectItem key={b.value} value={b.value}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-3 rounded-2xl border border-border/70 p-4 bg-muted/30">
              <Checkbox
                id="ativo"
                checked={isAtivo}
                onCheckedChange={(checked) => setValue("ativo", !!checked)}
              />
              <div className="space-y-0.5">
                <Label htmlFor="ativo" className="cursor-pointer font-bold">
                  Disponível para locação
                </Label>
                <p className="text-xs text-muted-foreground">
                  Brinquedo pronto para ser alugado pelos clientes.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="indigo" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </span>
                ) : (
                  "Salvar Brinquedo"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Excluir Brinquedo */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-sm text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 mb-2">
            <Trash2 className="h-6 w-6" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-center">
              Remover Brinquedo
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Deseja excluir permanentemente o item{" "}
            <span className="font-bold text-foreground">
              "{formatTitleCase(brinquedoToDelete?.tipo.replaceAll("-", " "))}"
            </span>
            ?
          </p>

          <DialogFooter className="flex-col sm:flex-col gap-2 pt-2">
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={submitting}
              className="w-full rounded-xl"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Sim, remover"
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={submitting}
              className="w-full"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
