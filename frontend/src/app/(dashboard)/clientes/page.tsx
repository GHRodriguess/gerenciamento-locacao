"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Search,
  MessageCircle,
  Pencil,
  Trash2,
  Calendar,
  AlertCircle,
  Loader2,
} from "lucide-react";
import authFetch from "@/lib/api";
import { Cliente } from "@/types";
import { clienteSchema, ClienteFormData } from "@/schemas";
import { formatTitleCase, maskPhone } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Cliente | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: "",
      numero_celular: "",
    },
  });

  const fetchClientes = async () => {
    try {
      const response = await authFetch("/clientes/");
      if (response.ok) {
        const data: Cliente[] = await response.json();
        const sortedData = data.sort((a, b) =>
          a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
        );
        setClientes(sortedData);
      }
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      toast.error("Erro ao carregar clientes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const clientesFiltrados = clientes.filter(
    (cliente) =>
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.numero_celular.includes(searchTerm)
  );

  const handleOpenModal = (cliente?: Cliente) => {
    if (cliente) {
      setIsEditing(true);
      setCurrentId(cliente.id);
      setValue("nome", cliente.nome);
      setValue("numero_celular", cliente.numero_celular);
    } else {
      setIsEditing(false);
      setCurrentId(null);
      reset({ nome: "", numero_celular: "" });
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (data: ClienteFormData) => {
    setSubmitting(true);
    const method = isEditing ? "PATCH" : "POST";
    const url = isEditing ? `/clientes/${currentId}/` : "/clientes/";

    try {
      const response = await authFetch(url, {
        method,
        body: JSON.stringify({
          nome: formatTitleCase(data.nome),
          numero_celular: data.numero_celular,
          locacoes: isEditing
            ? clientes.find((c) => c.id === currentId)?.locacoes || []
            : [],
        }),
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchClientes();
        toast.success(
          isEditing
            ? "Cliente atualizado com sucesso!"
            : "Cliente cadastrado com sucesso!"
        );
      } else {
        toast.error("Erro ao salvar cliente.");
      }
    } catch (error) {
      console.error("Erro na operação:", error);
      toast.error("Erro de conexão ao salvar cliente.");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (cliente: Cliente) => {
    setClientToDelete(cliente);
    setDeleteError("");
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;
    setSubmitting(true);
    setDeleteError("");

    try {
      const response = await authFetch(`/clientes/${clientToDelete.id}/`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchClientes();
        setIsDeleteModalOpen(false);
        toast.success("Cliente removido com sucesso.");
        return;
      }

      const data = await response.json().catch(() => ({}));
      if (response.status === 409 || data.message) {
        setDeleteError(
          data.message ||
            "Não é possível remover este cliente pois ele possui locações vinculadas."
        );
      } else {
        setDeleteError("Erro ao remover cliente.");
      }
    } catch (error) {
      console.error("Erro ao deletar cliente:", error);
      setDeleteError("Erro inesperado ao remover cliente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Gestão de Clientes"
        description="Cadastre clientes, consulte histórico e inicie conversas rapidamente via WhatsApp."
      />

      <main className="p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Pesquisar por nome ou celular..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Button
            variant="indigo"
            onClick={() => handleOpenModal()}
            className="rounded-2xl h-11 px-6 font-bold"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Novo Cliente
          </Button>
        </div>

        {/* List of Clients */}
        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : clientesFiltrados.length > 0 ? (
          <div className="grid gap-3">
            {clientesFiltrados.map((cliente) => (
              <Card
                key={cliente.id}
                className="hover:border-primary/40 transition-all overflow-hidden"
              >
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base sm:text-lg text-foreground">
                        {cliente.nome}
                      </h3>
                      <Badge variant="secondary" className="font-mono text-[11px]">
                        {(cliente.locacoes?.length || 0) === 1
                          ? "1 locação"
                          : `${cliente.locacoes?.length || 0} locações`}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {maskPhone(cliente.numero_celular)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {cliente.numero_celular && (
                      <a
                        href={`https://wa.me/55${cliente.numero_celular.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                        title="Enviar mensagem no WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenModal(cliente)}
                      className="h-10 w-10 text-amber-500 hover:bg-amber-500/10 rounded-xl"
                      title="Editar cliente"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteModal(cliente)}
                      className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl"
                      title="Remover cliente"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center border-dashed">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-bold text-foreground">
              {searchTerm
                ? "Nenhum cliente encontrado para esta pesquisa"
                : "Nenhum cliente cadastrado"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Cadastre seu primeiro cliente para começar a agendar locações.
            </p>
          </Card>
        )}
      </main>

      {/* Modal Criar/Editar Cliente */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {isEditing ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                placeholder="Nome do cliente"
                disabled={submitting}
                {...register("nome")}
              />
              {errors.nome && (
                <p className="text-xs font-medium text-destructive">
                  {errors.nome.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_celular">Telefone / WhatsApp</Label>
              <Input
                id="numero_celular"
                placeholder="(41) 99999-9999"
                disabled={submitting}
                {...register("numero_celular", {
                  onChange: (e) => {
                    e.target.value = maskPhone(e.target.value);
                  },
                })}
              />
              {errors.numero_celular && (
                <p className="text-xs font-medium text-destructive">
                  {errors.numero_celular.message}
                </p>
              )}
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
                ) : isEditing ? (
                  "Atualizar Cliente"
                ) : (
                  "Salvar Cliente"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Excluir Cliente */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-sm text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 mb-2">
            <Trash2 className="h-6 w-6" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-center">
              Remover Cliente
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Deseja realmente remover o cliente{" "}
            <span className="font-bold text-foreground">
              {clientToDelete?.nome}
            </span>
            ?
          </p>

          {deleteError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center gap-2 text-left">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

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
