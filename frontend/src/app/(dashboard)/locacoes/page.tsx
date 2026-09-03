"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Calendar,
  MapPin,
  Package,
  Trash2,
  Edit,
  Search,
  UserPlus,
  CheckCircle2,
  X,
  Info,
  Plus,
  DollarSign,
  History,
  AlertCircle,
  RotateCcw,
  Share2,
  Copy,
  Check,
  Castle,
  Clock,
  Loader2,
  ArrowRight,
  ArrowLeft,
  MapPinOff,
} from "lucide-react";
import authFetch from "@/lib/api";
import { Locacao, Cliente, Brinquedo, LocacaoFormData } from "@/types";
import {
  formatCurrency,
  formatTitleCase,
  formatDateTimeBR,
  maskPhone,
} from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DynamicLocationPickerMap } from "@/components/map/dynamic-location-picker";
import { RouteButton } from "@/components/map/route-button";
import { fetchAddressByCep, geocodeAddress, geocodeFullAddress } from "@/lib/geo";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function LocacoesPage() {
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [brinquedos, setBrinquedos] = useState<Brinquedo[]>([]);
  const [view, setView] = useState<"futuras" | "ativas" | "canceladas" | "sem_endereco">("futuras");

  const [step, setStep] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdUuid, setCreatedUuid] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingBrinquedos, setLoadingBrinquedos] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [semEndereco, setSemEndereco] = useState(false);

  const [showQuickClient, setShowQuickClient] = useState(false);
  const [quickClient, setQuickClient] = useState({
    nome: "",
    numero_celular: "",
  });

  const [loadingCep, setLoadingCep] = useState(false);
  const [geocodingMap, setGeocodingMap] = useState(false);

  const initialForm: LocacaoFormData = {
    cliente_id: "",
    data_montagem: "",
    data_devolucao: "",
    valor_total: "",
    brinquedos_ids: [],
    endereco: {
      rua: "",
      numero: "",
      cidade: "",
      bairro: "",
      estado: "PR",
      cep: "",
      complemento: "",
      latitude: null,
      longitude: null,
    },
  };

  const [formData, setFormData] = useState<LocacaoFormData>(initialForm);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [locacaoIdToDelete, setLocacaoIdToDelete] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resLoc, resCli] = await Promise.all([
        authFetch("/locacoes/todas"),
        authFetch("/clientes/"),
      ]);

      if (resLoc.ok) {
        const dataLoc: Locacao[] = await resLoc.json();
        const ordenado = dataLoc.sort(
          (a, b) =>
            new Date(a.data_montagem).getTime() -
            new Date(b.data_montagem).getTime()
        );
        setLocacoes(ordenado);
      }

      if (resCli.ok) {
        const dataCli: Cliente[] = await resCli.json();
        const sortedData = dataCli.sort((a, b) =>
          a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
        );
        setClientes(sortedData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar locações.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchAvailableToys = async () => {
    if (!formData.data_montagem || !formData.data_devolucao) return;

    setLoadingBrinquedos(true);
    try {
      const inicio = new Date(formData.data_montagem).toISOString();
      const fim = new Date(formData.data_devolucao).toISOString();
      const query = `/brinquedos/disponiveis/?inicio=${inicio}&fim=${fim}`;

      const res = await authFetch(query);
      if (res.ok) {
        let data: Brinquedo[] = await res.json();
        if (isEditing && currentId) {
          const locAtual = locacoes.find((l) => l.id === currentId);
          if (locAtual?.brinquedos) {
            const currentToyIds = new Set(data.map((b) => b.id));
            const existingToAdd = locAtual.brinquedos.filter(
              (b) => !currentToyIds.has(b.id)
            );
            data = [...existingToAdd, ...data];
          }
        }
        setBrinquedos(data);
      }
    } catch (error) {
      console.error("Erro ao buscar disponibilidade:", error);
    } finally {
      setLoadingBrinquedos(false);
    }
  };

  useEffect(() => {
    if (step === 3) {
      fetchAvailableToys();
    }
  }, [step]);

  const locacoesExibidas = locacoes.filter((loc) => {
    if (view === "canceladas") {
      return loc.cancelada === true;
    }
    if (loc.cancelada === true) {
      return false;
    }
    if (view === "sem_endereco") {
      return !loc.endereco || !loc.endereco.rua;
    }
    if (view === "ativas") {
      return true;
    }
    if (view === "futuras") {
      const dataDevolucao = loc.data_devolucao
        ? new Date(loc.data_devolucao)
        : null;
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      return dataDevolucao && dataDevolucao >= hoje;
    }
    return true;
  });

  const handleOpenModal = (locacao?: Locacao) => {
    setErrorMsg("");
    setStep(1);
    setShowSuccess(false);
    setCreatedUuid(null);
    if (locacao) {
      setIsEditing(true);
      setCurrentId(locacao.id);
      const isSemEnd = !locacao.endereco || !locacao.endereco.rua;
      setSemEndereco(isSemEnd);
      setFormData({
        cliente_id: locacao.cliente.id,
        data_montagem: locacao.data_montagem
          ? locacao.data_montagem.slice(0, 16)
          : "",
        data_devolucao: locacao.data_devolucao
          ? locacao.data_devolucao.slice(0, 16)
          : "",
        valor_total: String(locacao.valor_total),
        brinquedos_ids: locacao.brinquedos
          ? locacao.brinquedos.map((b) => b.id)
          : [],
        endereco: {
          rua: locacao.endereco?.rua || "",
          numero: locacao.endereco?.numero || "",
          cidade: locacao.endereco?.cidade || "",
          bairro: locacao.endereco?.bairro || "",
          estado: locacao.endereco?.estado || "PR",
          cep: locacao.endereco?.cep || "",
          complemento: locacao.endereco?.complemento || "",
          latitude: locacao.endereco?.latitude ?? null,
          longitude: locacao.endereco?.longitude ?? null,
        },
      });
    } else {
      setIsEditing(false);
      setCurrentId(null);
      setSemEndereco(false);
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  const autoGeocodeAddress = async (enderecoData: typeof formData.endereco) => {
    if (!enderecoData.rua || enderecoData.rua.trim().length < 3 || !enderecoData.cidade) return;
    setGeocodingMap(true);
    const geo = await geocodeFullAddress(enderecoData);
    setGeocodingMap(false);
    if (geo) {
      setFormData((prev) => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          latitude: geo.lat,
          longitude: geo.lng,
        },
      }));
    }
  };

  // Busca automática de coordenadas com base em Rua, Número, Bairro, Cidade
  useEffect(() => {
    if (step !== 4) return;
    const { rua, cidade } = formData.endereco;
    if (!rua || rua.trim().length < 3 || !cidade) return;

    const timer = setTimeout(() => {
      autoGeocodeAddress(formData.endereco);
    }, 700);

    return () => clearTimeout(timer);
  }, [
    step,
    formData.endereco.rua,
    formData.endereco.numero,
    formData.endereco.bairro,
    formData.endereco.cidade,
    formData.endereco.estado,
  ]);

  const handleCepSearch = async (cepInput: string) => {
    const clean = cepInput.replace(/\D/g, "");
    if (clean.length === 8) {
      setLoadingCep(true);
      const data = await fetchAddressByCep(clean);
      setLoadingCep(false);
      if (data) {
        const newAddress = {
          ...formData.endereco,
          cep: data.cep,
          rua: data.logradouro || formData.endereco.rua,
          bairro: data.bairro || formData.endereco.bairro,
          cidade: data.localidade || formData.endereco.cidade,
          estado: data.uf || formData.endereco.estado,
        };

        setFormData({
          ...formData,
          endereco: newAddress,
        });

        // Tenta geocodificar com número se já existir
        const geo = await geocodeFullAddress(newAddress);
        if (geo) {
          setFormData((prev) => ({
            ...prev,
            endereco: {
              ...prev.endereco,
              latitude: geo.lat,
              longitude: geo.lng,
            },
          }));
        }

        toast.success("Endereço encontrado pelo CEP!");
      } else {
        toast.error("CEP não encontrado.");
      }
    }
  };

  const handleGeocodeAddress = async () => {
    const { rua, cidade } = formData.endereco;
    if (!rua || !cidade) {
      toast.error("Preencha ao menos a rua e a cidade para localizar.");
      return;
    }

    setGeocodingMap(true);
    const geo = await geocodeFullAddress(formData.endereco);
    setGeocodingMap(false);

    if (geo) {
      setFormData({
        ...formData,
        endereco: {
          ...formData.endereco,
          latitude: geo.lat,
          longitude: geo.lng,
        },
      });
      toast.success("Localização atualizada no mapa!");
    } else {
      toast.error("Não foi possível localizar o endereço no mapa. Arraste o pin manualmente.");
    }
  };

  const handleCopyLink = (uuid: string) => {
    const link = `${window.location.origin}/locacao/${uuid}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado para a área de transferência!");
  };

  const handleNextStep = () => {
    if (step === 1 && (!formData.cliente_id || !formData.valor_total)) return;
    if (step === 2 && (!formData.data_montagem || !formData.data_devolucao))
      return;
    if (step === 3 && formData.brinquedos_ids.length === 0) return;
    if (
      step === 4 &&
      !semEndereco &&
      (!formData.endereco.rua ||
        !formData.endereco.numero ||
        !formData.endereco.cidade)
    )
      return;
    setStep((s) => s + 1);
  };

  const handlePrevStep = () => setStep((s) => s - 1);

  const handleQuickClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickClient.nome || !quickClient.numero_celular) return;

    try {
      const res = await authFetch("/clientes/", {
        method: "POST",
        body: JSON.stringify({
          nome: formatTitleCase(quickClient.nome),
          numero_celular: quickClient.numero_celular,
          locacoes: [],
        }),
      });
      if (res.ok) {
        const newClient: Cliente = await res.json();
        const updatedClientes = [...clientes, newClient].sort((a, b) =>
          a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
        );
        setClientes(updatedClientes);
        setFormData({ ...formData, cliente_id: newClient.id });
        setShowQuickClient(false);
        setQuickClient({ nome: "", numero_celular: "" });
        toast.success(`Cliente ${newClient.nome} cadastrado e selecionado!`);
      }
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
      toast.error("Erro ao cadastrar cliente rápido.");
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMsg("");
    const method = isEditing ? "PATCH" : "POST";
    const url = isEditing ? `/locacoes/${currentId}/` : "/locacoes/";

    const payload = {
      ...formData,
      endereco: semEndereco ? null : formData.endereco,
    };

    try {
      const response = await authFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        fetchData();
        if (!isEditing) {
          setCreatedUuid(data.uuid_publico);
          setShowSuccess(true);
          toast.success("Locação criada com sucesso!");
        } else {
          setIsModalOpen(false);
          toast.success("Locação atualizada com sucesso!");
        }
      } else {
        const err = await response.json().catch(() => ({}));
        setErrorMsg(
          err.message ||
            "Erro ao salvar locação. Verifique os campos e tente novamente."
        );
        toast.error("Não foi possível salvar a locação.");
      }
    } catch (error) {
      console.error("Erro ao salvar locação:", error);
      setErrorMsg("Erro de conexão com o servidor.");
      toast.error("Erro de conexão.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!locacaoIdToDelete) return;
    setSubmitting(true);
    try {
      const response = await authFetch(`/locacoes/${locacaoIdToDelete}/`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchData();
        setIsDeleteModalOpen(false);
        toast.success("Locação removida/cancelada.");
      } else {
        toast.error("Erro ao remover locação.");
      }
    } catch (error) {
      console.error("Erro ao apagar:", error);
      toast.error("Erro de conexão.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestore = async (id: number) => {
    try {
      const response = await authFetch(`/locacoes/${id}/restaurar/`, {
        method: "PATCH",
      });

      if (response.ok) {
        fetchData();
        toast.success("Locação restaurada com sucesso!");
      } else {
        toast.error("Não foi possível restaurar a locação.");
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      toast.error("Erro de conexão.");
    }
  };

  const filteredClientes = clientes.filter((c) =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Gestão de Locações"
        description="Acompanhe contratos, agende montagens e compartilhe links de confirmação."
      />

      <main className="p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
        {/* Navigation Tabs and Create Button */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div className="flex items-center gap-1 sm:gap-1.5 p-1.5 bg-muted/60 border border-border/70 rounded-2xl w-full sm:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setView("futuras")}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                view === "futuras"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calendar className="h-4 w-4 shrink-0" /> Próximas
            </button>
            <button
              onClick={() => setView("ativas")}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                view === "ativas"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <History className="h-4 w-4 shrink-0" /> Histórico
            </button>
            <button
              onClick={() => setView("sem_endereco")}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                view === "sem_endereco"
                  ? "bg-amber-500 text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MapPinOff className="h-4 w-4 shrink-0" /> Sem Endereço
            </button>
            <button
              onClick={() => setView("canceladas")}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                view === "canceladas"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Trash2 className="h-4 w-4 shrink-0" /> Canceladas
            </button>
          </div>

          <Button
            variant="indigo"
            onClick={() => handleOpenModal()}
            className="rounded-2xl h-11 px-6 font-bold shadow-md"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Nova Locação
          </Button>
        </div>

        {/* List of Locacoes */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-3xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : locacoesExibidas.length > 0 ? (
          <div className="grid gap-4">
            {locacoesExibidas.map((loc) => (
              <Card
                key={loc.id}
                className="hover:border-primary/40 transition-all overflow-hidden"
              >
                <CardContent className="p-6 flex flex-col md:flex-row justify-between gap-6">
                  {/* Left Column: Details */}
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                          Cliente Contratante
                        </span>
                        <h3 className="font-bold text-xl text-foreground">
                          {loc.cliente?.nome || "Cliente Não Informado"}
                        </h3>
                      </div>
                      <div className="sm:text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Valor do Contrato
                        </span>
                        <p className="font-mono font-black text-xl text-emerald-500">
                          {formatCurrency(loc.valor_total)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Horários */}
                      <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-2xl border border-border/50">
                        <Clock className="h-4 w-4 text-indigo-500 shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">
                            Período
                          </p>
                          <p className="font-medium text-foreground">
                            {formatDateTimeBR(loc.data_montagem)} —{" "}
                            {formatDateTimeBR(loc.data_devolucao)}
                          </p>
                        </div>
                      </div>

                      {/* Local */}
                      <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-2xl border border-border/50">
                        <MapPin className={`h-4 w-4 shrink-0 ${loc.endereco?.rua ? "text-rose-500" : "text-amber-500"}`} />
                        <div className="truncate flex-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">
                            Local
                          </p>
                          {loc.endereco?.rua ? (
                            <p className="font-medium text-foreground truncate">
                              {loc.endereco.rua}, {loc.endereco.numero} •{" "}
                              {loc.endereco.cidade}
                            </p>
                          ) : (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                Endereço a definir
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Brinquedos contratados */}
                    <div className="flex items-start gap-2 pt-1">
                      <Package className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <div className="flex flex-wrap gap-1.5">
                        {loc.brinquedos?.map((b) => (
                          <Badge
                            key={b.id}
                            variant="secondary"
                            className="text-[11px] font-medium"
                          >
                            {formatTitleCase(b.tipo.replaceAll("-", " "))}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex md:flex-col justify-end md:justify-center items-center gap-2 border-t md:border-t-0 md:border-l border-border/70 pt-4 md:pt-0 md:pl-6">
                    {view === "canceladas" ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRestore(loc.id)}
                        className="h-10 w-10 text-emerald-500 hover:bg-emerald-500/10 rounded-xl"
                        title="Restaurar locação"
                      >
                        <RotateCcw className="h-5 w-5" />
                      </Button>
                    ) : (
                      <>
                        {loc.endereco?.rua && (
                          <RouteButton
                            endereco={loc.endereco}
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-indigo-500 hover:bg-indigo-500/10 rounded-xl"
                            showText={false}
                          />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyLink(loc.uuid_publico)}
                          className="h-10 w-10 text-emerald-500 hover:bg-emerald-500/10 rounded-xl"
                          title="Copiar link público de compartilhamento"
                        >
                          <Share2 className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenModal(loc)}
                          className="h-10 w-10 text-indigo-500 hover:bg-indigo-500/10 rounded-xl"
                          title="Editar locação"
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setLocacaoIdToDelete(loc.id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl"
                          title="Cancelar locação"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-16 text-center border-dashed">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-bold text-foreground">
              Nenhuma locação encontrada
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {view === "canceladas"
                ? "Nenhuma locação foi cancelada até o momento."
                : view === "sem_endereco"
                ? "Nenhuma locação está com endereço pendente."
                : "Não há registros correspondentes a esta categoria."}
            </p>
          </Card>
        )}
      </main>

      {/* Modal Wizard: Nova/Editar Locação */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          {showSuccess ? (
            <div className="p-8 sm:p-12 text-center space-y-6 animate-in zoom-in-95 duration-300">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <CheckCircle2 size={44} />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                  Locação Registrada!
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  A locação foi salva com sucesso no sistema.
                </p>
              </div>

              {createdUuid && (
                <div className="bg-muted/50 border border-border/70 p-6 rounded-3xl space-y-3 text-left">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                    Link de Confirmação para o Cliente
                  </p>
                  <div className="bg-background border border-border/70 p-3 rounded-2xl font-mono text-xs text-foreground truncate">
                    {typeof window !== "undefined" ? window.location.origin : ""}
                    /locacao/{createdUuid}
                  </div>
                  <Button
                    variant="indigo"
                    onClick={() => handleCopyLink(createdUuid)}
                    className="w-full h-11 font-bold rounded-2xl"
                  >
                    <Copy className="h-4 w-4 mr-2" /> Copiar Link
                  </Button>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="w-full rounded-2xl h-11"
              >
                Fechar Janela
              </Button>
            </div>
          ) : (
            <>
              {/* Header Wizard com Stepper */}
              <div className="p-6 border-b border-border/70 bg-card">
                <div className="flex justify-between items-center">
                  <DialogTitle className="text-xl font-bold">
                    {isEditing ? "Editar Locação" : "Nova Locação"}
                  </DialogTitle>
                  <span className="text-xs font-bold text-indigo-500">
                    Passo {step} de 5
                  </span>
                </div>
                {/* Stepper dots */}
                <div className="flex gap-2 mt-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        step >= i ? "bg-indigo-600" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Wizard Steps Content */}
              <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
                {/* PASSO 1: Cliente e Valor */}
                {step === 1 && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Selecionar Cliente
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowQuickClient(!showQuickClient)}
                        className="text-indigo-500 hover:text-indigo-600 text-xs font-bold"
                      >
                        {showQuickClient ? (
                          "Cancelar Cadastro Rápido"
                        ) : (
                          <>
                            <UserPlus className="h-3.5 w-3.5 mr-1" /> Novo
                            Cliente
                          </>
                        )}
                      </Button>
                    </div>

                    {showQuickClient ? (
                      <div className="bg-muted/40 p-4 rounded-2xl border border-border/70 space-y-3">
                        <Input
                          placeholder="Nome do cliente"
                          value={quickClient.nome}
                          onChange={(e) =>
                            setQuickClient({
                              ...quickClient,
                              nome: formatTitleCase(e.target.value),
                            })
                          }
                        />
                        <Input
                          placeholder="Telefone (WhatsApp)"
                          value={quickClient.numero_celular}
                          onChange={(e) =>
                            setQuickClient({
                              ...quickClient,
                              numero_celular: maskPhone(e.target.value),
                            })
                          }
                        />
                        <Button
                          type="button"
                          variant="indigo"
                          onClick={handleQuickClientSubmit}
                          className="w-full rounded-xl"
                        >
                          Salvar e Selecionar
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar cliente por nome..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>

                        <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
                          {filteredClientes.length > 0 ? (
                            filteredClientes.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    cliente_id: c.id,
                                  })
                                }
                                className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                                  formData.cliente_id === c.id
                                    ? "bg-indigo-600/10 border-indigo-500 text-foreground"
                                    : "bg-muted/30 border-border/60 hover:bg-muted/60 text-muted-foreground"
                                }`}
                              >
                                <span className="font-bold text-sm text-foreground">
                                  {c.nome}
                                </span>
                                {formData.cliente_id === c.id && (
                                  <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                                )}
                              </button>
                            ))
                          ) : (
                            <p className="text-center text-xs text-muted-foreground py-4">
                              Nenhum cliente encontrado.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 pt-2 border-t border-border/60">
                      <Label htmlFor="valor_total">Valor Total do Contrato (R$)</Label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
                          R$
                        </span>
                        <Input
                          id="valor_total"
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          className="pl-10 font-mono text-lg font-bold text-emerald-500"
                          value={formData.valor_total}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              valor_total: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* PASSO 2: Cronograma */}
                {step === 2 && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                        <Calendar className="h-5 w-5 text-indigo-500" /> Quando
                        será o evento?
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Defina o horário de montagem e retirada dos brinquedos.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="data_montagem">
                          Data e Hora da Montagem
                        </Label>
                        <Input
                          id="data_montagem"
                          type="datetime-local"
                          value={formData.data_montagem}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              data_montagem: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="data_devolucao">
                          Data e Hora da Desmontagem / Retirada
                        </Label>
                        <Input
                          id="data_devolucao"
                          type="datetime-local"
                          value={formData.data_devolucao}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              data_devolucao: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl flex items-center gap-3 text-xs text-indigo-500">
                      <Info className="h-5 w-5 shrink-0" />
                      <span>
                        O sistema verificará o estoque disponível
                        automaticamente no próximo passo.
                      </span>
                    </div>
                  </div>
                )}

                {/* PASSO 3: Seleção de Brinquedos Disponíveis */}
                {step === 3 && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                        <Package className="h-5 w-5 text-amber-500" /> Brinquedos
                        Disponíveis
                      </h3>
                      <Badge variant="info">
                        {formData.brinquedos_ids.length} selecionado(s)
                      </Badge>
                    </div>

                    {loadingBrinquedos ? (
                      <div className="py-16 text-center space-y-3">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto" />
                        <p className="text-sm font-medium text-muted-foreground">
                          Verificando disponibilidade de brinquedos...
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {brinquedos.length > 0 ? (
                          brinquedos.map((b) => {
                            const isSelected = formData.brinquedos_ids.includes(
                              b.id
                            );
                            return (
                              <label
                                key={b.id}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                                  isSelected
                                    ? "bg-indigo-600/10 border-indigo-500 text-foreground"
                                    : "bg-muted/30 border-border/60 hover:border-primary/40"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="hidden"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const ids = e.target.checked
                                      ? [...formData.brinquedos_ids, b.id]
                                      : formData.brinquedos_ids.filter(
                                          (id) => id !== b.id
                                        );
                                    setFormData({
                                      ...formData,
                                      brinquedos_ids: ids,
                                    });
                                  }}
                                />
                                <div
                                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                    isSelected
                                      ? "bg-indigo-600 text-white"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  <Castle className="h-5 w-5" />
                                </div>
                                <div className="flex-1 truncate">
                                  <p className="text-xs font-bold text-foreground truncate">
                                    {formatTitleCase(
                                      b.tipo.replaceAll("-", " ")
                                    )}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    Patrimônio #{b.id}
                                  </p>
                                </div>
                                {isSelected && (
                                  <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />
                                )}
                              </label>
                            );
                          })
                        ) : (
                          <div className="col-span-full py-10 text-center bg-muted/20 border border-dashed rounded-2xl text-muted-foreground text-xs">
                            Nenhum brinquedo livre encontrado para este período.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* PASSO 4: Endereço e Mapa do Evento */}
                {step === 4 && (
                  <div className="space-y-5 animate-in fade-in">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div className="space-y-0.5">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                          <MapPin className="h-5 w-5 text-rose-500" /> Endereço do Evento
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Informe o endereço e ajuste o ponto no mapa para o GPS.
                        </p>
                      </div>
                      {!semEndereco && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleGeocodeAddress}
                          disabled={geocodingMap}
                          className="text-xs font-bold border-indigo-500/40 text-indigo-500 hover:bg-indigo-500/10 h-8 rounded-xl shrink-0"
                        >
                          {geocodingMap ? (
                            <span className="flex items-center gap-1.5">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Buscando...
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <Search className="h-3.5 w-3.5" /> Localizar no Mapa
                            </span>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Checkbox / Switch: Endereço a Definir */}
                    <div
                      className="flex items-center space-x-3 p-4 bg-amber-500/10 dark:bg-amber-500/15 rounded-2xl border border-amber-500/30 cursor-pointer transition-all hover:bg-amber-500/15"
                      onClick={() => setSemEndereco(!semEndereco)}
                    >
                      <Checkbox
                        id="sem-endereco"
                        checked={semEndereco}
                        onCheckedChange={(checked) => setSemEndereco(checked === true)}
                        className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 border-amber-500/60"
                      />
                      <div className="space-y-0.5">
                        <Label
                          htmlFor="sem-endereco"
                          className="text-sm font-bold text-foreground cursor-pointer flex items-center gap-2"
                        >
                          <MapPinOff className="h-4 w-4 text-amber-500" />
                          Definir endereço mais tarde (A combinar)
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Marque caso o endereço ainda não esteja definido. Você poderá preenchê-lo depois.
                        </p>
                      </div>
                    </div>

                    {semEndereco ? (
                      <div className="py-12 px-6 text-center bg-muted/20 border-2 border-dashed border-border/80 rounded-3xl space-y-3">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          <MapPinOff size={28} />
                        </div>
                        <h4 className="text-base font-bold text-foreground">
                          Endereço pendente / A combinar
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-md mx-auto">
                          A locação será cadastrada com status de <strong>Endereço a definir</strong>. Você poderá editar esta locação e cadastrar o endereço completo quando o cliente confirmar.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Linha 1: CEP e Bairro */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="cep" className="text-xs font-semibold">
                              CEP (Opcional)
                            </Label>
                            <div className="relative">
                              <Input
                                id="cep"
                                placeholder="00000-000"
                                value={formData.endereco.cep || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormData({
                                    ...formData,
                                    endereco: {
                                      ...formData.endereco,
                                      cep: val,
                                    },
                                  });
                                  if (val.replace(/\D/g, "").length === 8) {
                                    handleCepSearch(val);
                                  }
                                }}
                              />
                              {loadingCep && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-indigo-500" />
                              )}
                            </div>
                          </div>

                          <div className="sm:col-span-2 space-y-1.5">
                            <Label htmlFor="rua" className="text-xs font-semibold">
                              Rua / Logradouro *
                            </Label>
                            <Input
                              id="rua"
                              placeholder="Ex: Av. Brasil"
                              value={formData.endereco.rua}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  endereco: {
                                    ...formData.endereco,
                                    rua: e.target.value,
                                  },
                                })
                              }
                            />
                          </div>
                        </div>

                        {/* Linha 2: Número, Bairro, Cidade, Estado */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="numero" className="text-xs font-semibold">
                              Número *
                            </Label>
                            <Input
                              id="numero"
                              placeholder="Ex: 123"
                              value={formData.endereco.numero}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  endereco: {
                                    ...formData.endereco,
                                    numero: e.target.value,
                                  },
                                })
                              }
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="bairro" className="text-xs font-semibold">
                              Bairro
                            </Label>
                            <Input
                              id="bairro"
                              placeholder="Ex: Centro"
                              value={formData.endereco.bairro || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  endereco: {
                                    ...formData.endereco,
                                    bairro: e.target.value,
                                  },
                                })
                              }
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="cidade" className="text-xs font-semibold">
                              Cidade *
                            </Label>
                            <Input
                              id="cidade"
                              placeholder="Ex: Maringá"
                              value={formData.endereco.cidade}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  endereco: {
                                    ...formData.endereco,
                                    cidade: e.target.value,
                                  },
                                })
                              }
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="estado" className="text-xs font-semibold">
                              UF
                            </Label>
                            <Input
                              id="estado"
                              maxLength={2}
                              placeholder="PR"
                              value={formData.endereco.estado || "PR"}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  endereco: {
                                    ...formData.endereco,
                                    estado: e.target.value.toUpperCase(),
                                  },
                                })
                              }
                            />
                          </div>
                        </div>

                        {/* Linha 3: Complemento */}
                        <div className="space-y-1.5">
                          <Label htmlFor="complemento" className="text-xs font-semibold">
                            Complemento / Ponto de Referência (Opcional)
                          </Label>
                          <Input
                            id="complemento"
                            placeholder="Ex: Salão de festas do condomínio, Bloco B"
                            value={formData.endereco.complemento || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                endereco: {
                                  ...formData.endereco,
                                  complemento: e.target.value,
                                },
                              })
                            }
                          />
                        </div>

                        {/* Mapa Interativo de Seleção */}
                        <div className="space-y-2 pt-1">
                          <div className="flex justify-between items-center">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Ponto no Mapa & Coordenadas GPS
                            </Label>
                            {geocodingMap ? (
                              <Badge variant="outline" className="text-[10px] text-indigo-500 border-indigo-500/40 bg-indigo-500/10 animate-pulse flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" /> Buscando coordenadas automáticas...
                              </Badge>
                            ) : formData.endereco.latitude && formData.endereco.longitude ? (
                              <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
                                ✓ Localizado: {formData.endereco.rua ? `${formData.endereco.rua}${formData.endereco.numero ? `, nº ${formData.endereco.numero}` : ""}` : "Coordenadas vinculadas"}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                Preencha o endereço para buscar o GPS
                              </Badge>
                            )}
                          </div>

                          <DynamicLocationPickerMap
                            latitude={formData.endereco.latitude}
                            longitude={formData.endereco.longitude}
                            height="260px"
                            onChangeLocation={(coords) => {
                              setFormData((prev) => ({
                                ...prev,
                                endereco: {
                                  ...prev.endereco,
                                  latitude: coords.latitude,
                                  longitude: coords.longitude,
                                  rua: prev.endereco.rua || coords.reverseAddress?.rua || prev.endereco.rua,
                                  bairro: prev.endereco.bairro || coords.reverseAddress?.bairro || prev.endereco.bairro,
                                  cidade: prev.endereco.cidade || coords.reverseAddress?.cidade || prev.endereco.cidade,
                                  estado: prev.endereco.estado || coords.reverseAddress?.estado || prev.endereco.estado,
                                  cep: prev.endereco.cep || coords.reverseAddress?.cep || prev.endereco.cep,
                                },
                              }));
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PASSO 5: Revisão e Confirmação */}
                {step === 5 && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="text-center space-y-1">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-indigo-600/10 text-indigo-500 border border-indigo-500/20">
                        <CheckCircle2 size={30} />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">
                        Confirme os Detalhes
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Revise antes de finalizar a criação da locação.
                      </p>
                    </div>

                    <Card className="bg-muted/40 p-5 rounded-3xl space-y-4">
                      <div className="flex justify-between border-b border-border/70 pb-3 text-sm">
                        <span className="text-muted-foreground">Cliente:</span>
                        <span className="font-bold text-foreground">
                          {clientes.find((c) => c.id === formData.cliente_id)
                            ?.nome || "Não selecionado"}
                        </span>
                      </div>

                      <div className="flex justify-between border-b border-border/70 pb-3 text-sm">
                        <span className="text-muted-foreground">Valor Total:</span>
                        <span className="font-mono font-bold text-emerald-500 text-base">
                          {formatCurrency(formData.valor_total)}
                        </span>
                      </div>

                      <div className="flex justify-between border-b border-border/70 pb-3 text-sm">
                        <span className="text-muted-foreground">Local:</span>
                        <span className="font-medium text-foreground text-right">
                          {semEndereco ? (
                            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold">
                              Endereço a definir
                            </Badge>
                          ) : (
                            `${formData.endereco.rua}, ${formData.endereco.numero} • ${formData.endereco.cidade}`
                          )}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs text-muted-foreground font-bold uppercase">
                          Itens Selecionados ({formData.brinquedos_ids.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {formData.brinquedos_ids.map((id) => {
                            const toy = brinquedos.find((b) => b.id === id);
                            return (
                              <Badge key={id} variant="secondary">
                                {toy
                                  ? formatTitleCase(
                                      toy.tipo.replaceAll("-", " ")
                                    )
                                  : `Brinquedo #${id}`}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    </Card>

                    {errorMsg && (
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Wizard Footer Navigation */}
              <div className="p-6 border-t border-border/70 bg-card flex justify-between gap-3">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    disabled={submitting}
                    className="rounded-xl px-6"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsModalOpen(false)}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                )}

                {step < 5 ? (
                  <Button
                    type="button"
                    variant="indigo"
                    onClick={handleNextStep}
                    disabled={
                      (step === 1 &&
                        (!formData.cliente_id || !formData.valor_total)) ||
                      (step === 2 &&
                        (!formData.data_montagem || !formData.data_devolucao)) ||
                      (step === 3 && formData.brinquedos_ids.length === 0) ||
                      (step === 4 &&
                        !semEndereco &&
                        (!formData.endereco.rua ||
                          !formData.endereco.numero ||
                          !formData.endereco.cidade))
                    }
                    className="rounded-xl px-8 font-bold"
                  >
                    Continuar <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="emerald"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="rounded-xl px-8 font-bold"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Finalizando...
                      </span>
                    ) : isEditing ? (
                      "Salvar Alterações"
                    ) : (
                      "Finalizar Locação"
                    )}
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Excluir/Cancelar Locação */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-sm text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 mb-2">
            <Trash2 className="h-6 w-6" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-center">
              Cancelar Locação?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta ação liberará os brinquedos no estoque para as datas
            selecionadas.
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
                "Sim, cancelar locação"
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={submitting}
              className="w-full"
            >
              Voltar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
