"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  UserCheck,
  Plus,
  Mail,
  Trash2,
  Send,
  Loader2,
  Users,
  AtSign,
} from "lucide-react";
import authFetch from "@/lib/api";
import { UserProfile } from "@/types";
import { colaboradorSchema, ColaboradorFormData } from "@/schemas";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ColaboradoresPage() {
  const [colaboradores, setColaboradores] = useState<UserProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sendingEmailId, setSendingEmailId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ColaboradorFormData>({
    resolver: zodResolver(colaboradorSchema),
    defaultValues: {
      username: "",
      first_name: "",
      last_name: "",
      email: "",
    },
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await authFetch("/users/");
      if (response.ok) {
        const data: UserProfile[] = await response.json();
        setColaboradores(data);
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      toast.error("Erro ao carregar lista de colaboradores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const generateRandomPassword = (length = 16) => {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  };

  const onSubmit = async (data: ColaboradorFormData) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        password: generateRandomPassword(16),
      };

      const response = await authFetch("/users/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsModalOpen(false);
        reset();
        fetchUsers();
        toast.success("Colaborador cadastrado com sucesso!");
      } else {
        const errData = await response.json().catch(() => ({}));
        toast.error(
          errData.username?.[0] ||
            errData.email?.[0] ||
            "Erro ao cadastrar colaborador."
        );
      }
    } catch (error) {
      console.error("Erro ao criar colaborador:", error);
      toast.error("Erro de conexão com o servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setSubmitting(true);
    try {
      const response = await authFetch(`/users/${userToDelete.id}/`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchUsers();
        setIsDeleteModalOpen(false);
        toast.success("Colaborador removido com sucesso.");
      } else {
        toast.error("Erro ao remover colaborador.");
      }
    } catch (error) {
      console.error("Erro ao excluir colaborador:", error);
      toast.error("Erro ao conectar com o servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailResetPassword = async (userId: number) => {
    setSendingEmailId(userId);
    try {
      const response = await authFetch(
        `/users/${userId}/send_email_reset_password/`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        toast.success("E-mail de redefinição de senha enviado com sucesso!");
      } else {
        toast.error("Erro ao enviar e-mail de redefinição.");
      }
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      toast.error("Erro ao conectar com o servidor de e-mail.");
    } finally {
      setSendingEmailId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Gestão de Colaboradores"
        description="Gerencie os usuários da equipe que possuem acesso ao painel de locações."
      />

      <main className="p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-500" /> Equipe Cadastrada (
            {colaboradores.length})
          </h2>

          <Button
            variant="indigo"
            onClick={() => setIsModalOpen(true)}
            className="rounded-2xl h-11 px-6 font-bold shadow-md w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Novo Colaborador
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : colaboradores.length > 0 ? (
          <div className="grid gap-3">
            {colaboradores.map((user) => (
              <Card
                key={user.id || user.username}
                className="hover:border-primary/40 transition-all overflow-hidden"
              >
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1 w-full sm:w-auto">
                    <Avatar className="h-11 w-11 border border-border shrink-0">
                      <AvatarFallback className="bg-indigo-600/10 text-indigo-500 font-bold text-sm">
                        {(user.first_name || user.username)
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1 space-y-1">
                      <h3 className="font-bold text-sm sm:text-base text-foreground truncate">
                        {user.first_name} {user.last_name}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground">
                        <span className="truncate flex items-center gap-1" title={user.email}>
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground flex items-center gap-0.5">
                          <AtSign className="h-3 w-3 shrink-0" />
                          {user.username}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={sendingEmailId === user.id}
                      onClick={() => handleEmailResetPassword(user.id)}
                      className="h-9 px-3 text-amber-500 hover:bg-amber-500/10 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                      title="Enviar e-mail para redefinição de senha"
                    >
                      {sendingEmailId === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      <span className="sm:hidden">Redefinir Senha</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setUserToDelete(user);
                        setIsDeleteModalOpen(true);
                      }}
                      className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-xl"
                      title="Remover colaborador"
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
            <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-bold text-foreground">
              Nenhum colaborador encontrado
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Cadastre novos colaboradores para compartilhar o acesso ao sistema.
            </p>
          </Card>
        )}
      </main>

      {/* Modal Criar Colaborador */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Novo Colaborador
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="nome.sobrenome"
                disabled={submitting}
                {...register("username")}
              />
              {errors.username && (
                <p className="text-xs font-medium text-destructive">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="first_name">Primeiro Nome</Label>
                <Input
                  id="first_name"
                  placeholder="Nome"
                  disabled={submitting}
                  {...register("first_name")}
                />
                {errors.first_name && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.first_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Sobrenome</Label>
                <Input
                  id="last_name"
                  placeholder="Sobrenome"
                  disabled={submitting}
                  {...register("last_name")}
                />
                {errors.last_name && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.last_name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="colaborador@empresa.com"
                disabled={submitting}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs font-medium text-destructive">
                  {errors.email.message}
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
                ) : (
                  "Salvar Colaborador"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Excluir Colaborador */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-sm text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 mb-2">
            <Trash2 className="h-6 w-6" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-center">
              Remover Colaborador
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja remover o colaborador{" "}
            <span className="font-bold text-foreground">
              @{userToDelete?.username}
            </span>
            ? Esta ação não pode ser desfeita.
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
                "Sim, remover agora"
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
