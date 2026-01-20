import React, { useState, useEffect } from "react";
import {
    Calendar,
    MapPin,
    Package,
    Trash2,
    Edit,
    ChevronRight,
    ChevronLeft,
    Search,
    UserPlus,
    CheckCircle2,
    X,
    Info,
    Plus,
    DollarSign,
    LayoutList,
    History,
    AlertCircle,
} from "lucide-react";
import authFetch from "../auth/utils/AuthFetch";
import Navbar from "../components/NavBar";

const API_URL = import.meta.env.VITE_API_URL;



const Locacoes = () => {
    const [locacoes, setLocacoes] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [brinquedos, setBrinquedos] = useState([]);
    const [view, setView] = useState("futuras");

    const [step, setStep] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [loadingBrinquedos, setLoadingBrinquedos] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [showQuickClient, setShowQuickClient] = useState(false);
    const [quickClient, setQuickClient] = useState({ nome: "", numero_celular: "" , locacoes: []});

    const initialForm = {
        cliente_id: "",
        data_montagem: "",
        data_devolucao: "",
        valor_total: "",
        brinquedos: [],
        brinquedos_ids: [],
        endereco: {
            rua: "",
            numero: "",
            complemento: "",
            bairro: "",
            cidade: "",
            estado: "",
            cep: "",
        },
    };

    const [formData, setFormData] = useState(initialForm);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [locacaoIdToDelete, setLocacaoIdToDelete] = useState(null);

    const fetchData = async () => {
        try {
            const resLoc = await authFetch(API_URL + "/locacoes/").catch(
                () => ({ ok: false }),
            );
            const resCli = await authFetch(API_URL + "/clientes/").catch(
                () => ({ ok: false }),
            );

            if (resLoc.ok) setLocacoes(await resLoc.json());
            if (resCli.ok) setClientes(await resCli.json());

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        }
    };

    const maskPhone = (value) => {
        if (!value) return "";
        value = value.replace(/\D/g, "");
        value = value.replace(/(\d{2})(\d)/, "($1) $2");
        value = value.replace(/(\d{5})(\d)/, "$1-$2");
        return value.substring(0, 15);
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

            const res = await authFetch(API_URL + query);
            if (res.ok) {
                let data = await res.json();
                
                if (isEditing) {
                    data = [...formData.brinquedos, ...data]

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
        if (view === "todas") return true;
        return loc.data_devolucao
            ? new Date(loc.data_devolucao) >= new Date()
            : true;
    });

    const handleOpenModal = (locacao = null) => {
        setErrorMsg("");
        setStep(1);
        if (locacao) {            
            setIsEditing(true);
            setCurrentId(locacao.id);
            setFormData({
                cliente_id: locacao.cliente.id,
                data_montagem: locacao.data_montagem
                    ? locacao.data_montagem.slice(0, 16)
                    : "",
                data_devolucao: locacao.data_devolucao
                    ? locacao.data_devolucao.slice(0, 16)
                    : "",
                valor_total: locacao.valor_total,
                brinquedos: locacao.brinquedos,
                brinquedos_ids: locacao.brinquedos
                    ? locacao.brinquedos.map((b) => b.id)
                    : [],
                endereco: locacao.endereco || initialForm.endereco,
            });

        } else {
            setIsEditing(false);
            setFormData(initialForm);
        }
        setIsModalOpen(true);
    };

    const handleNextStep = () => {
        if (step === 1 && !formData.cliente_id) return;
        if (step === 2 && (!formData.data_montagem || !formData.data_devolucao))
            return;
        setStep((s) => s + 1);
    };

    const handlePrevStep = () => setStep((s) => s - 1);

    const handleQuickClientSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await authFetch(API_URL + "/clientes/", {
                method: "POST",
                body: JSON.stringify(quickClient),
            });
            if (res.ok) {
                const newClient = await res.json();
                setClientes([...clientes, newClient]);
                setFormData({ ...formData, cliente_id: newClient.id });
                setShowQuickClient(false);
                setQuickClient({ nome: "", numero_celular: "" , locacoes: []});
            } else {
                setShowQuickClient(false);
            }
        } catch (error) {
            console.error("Erro ao criar cliente:", error);
        }
    };

    const handleSubmit = async () => {
        const method = isEditing ? "PATCH" : "POST";
        const url = isEditing
            ? `${API_URL}/locacoes/${currentId}/`
            : `${API_URL}/locacoes/`;

        try {
            const response = await authFetch(url, {
                method: method,
                body: JSON.stringify(formData),
            });
            if (response.ok) {
                setIsModalOpen(false);
                fetchData();
            } else {
                const err = await response.json().catch(() => ({}));
                console.error(err)
                setErrorMsg(
                    err.message ||
                        "Erro ao guardar locação. Verifique a ligação com o servidor. 1",
                );
            }
        } catch (error) {
            console.error("Erro ao guardar locação:", error);
            setErrorMsg("Erro de ligação com o servidor da API.");
        }
    };

    const confirmDelete = async () => {
        try {
            const response = await authFetch(
                `${API_URL}/locacoes/${locacaoIdToDelete}/`,
                {
                    method: "DELETE",
                },
            );
            if (response.ok) {
                fetchData();
                setIsDeleteModalOpen(false);
            }
        } catch (error) {
            console.error("Erro ao apagar:", error);
        }
    };

    const formatTitleCase = (value) => {
        if (!value) return "";
        return value
            .toLowerCase()
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    const filteredClientes = clientes.filter((c) =>
        c.nome.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
            <Navbar setIsMenuOpen isMenuOpen />
            <main className="p-4 max-w-5xl mx-auto space-y-6">                
                <div className="flex flex-col md:flex-row justify-items-start items-start md:items-start gap-4 border-b border-slate-800 pb-6">
                    <div>
                        
                        <div className="flex gap-2">
                            <button
                                onClick={() => setView("futuras")}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${view === "futuras" ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"}`}
                            >
                                <Calendar size={14} /> Próximas
                            </button>
                            <button
                                onClick={() => setView("todas")}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${view === "todas" ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"}`}
                            >
                                <History size={14} /> Histórico Geral
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-xl shadow-indigo-600/20 active:scale-95"
                    >
                        <Plus size={20} /> Nova Locação
                    </button>
                </div>

                <div className="grid gap-4">
                    {locacoesExibidas.length > 0 ? (
                        locacoesExibidas.map((loc) => (
                            <div
                                key={loc.id}
                                className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col md:flex-row hover:border-slate-700 transition-colors group"
                            >
                                <div className="p-6 flex-1 bg-slate-950/50 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">
                                                Cliente
                                            </p>
                                            <h3 className="font-bold text-xl text-white  truncate max-w-50 group-hover:text-indigo-400 transition-colors">
                                                {loc.cliente.nome}
                                            </h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                                                Total
                                            </p>
                                            <span className="text-emerald-400 font-mono font-black text-lg">
                                                R$ {loc.valor_total}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-400">
                                        <div className="flex items-center gap-3 border-slate-800  p-3 rounded-2xl border ">
                                            <Calendar
                                                size={18}
                                                className="text-indigo-500"
                                            />
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-500">
                                                    Período
                                                </p>
                                                <p className="text-slate-300">
                                                    {loc.data_montagem
                                                        ? new Date(
                                                                loc.data_montagem,
                                                            ).toLocaleTimeString(
                                                                "pt-BR", {"day": "2-digit", "month": "2-digit", "hour": "2-digit", "minute": "2-digit"}
                                                            )
                                                        : "N/A"}{" "}
                                                    —  
                                                    {loc.data_devolucao
                                                        ? new Date(
                                                                loc.data_devolucao,
                                                            ).toLocaleTimeString(
                                                                "pt-BR", {"day": "2-digit", "month": "2-digit", "hour": "2-digit", "minute": "2-digit"}
                                                            )
                                                        : "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 border-slate-800  p-3 rounded-2xl border ">
                                            <MapPin
                                                size={18}
                                                className="text-rose-500"
                                            />
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-500">
                                                    Local
                                                </p>
                                                <p className="text-slate-300">
                                                    {loc.endereco?.bairro ||
                                                        "N/A"}
                                                    ,{" "}
                                                    {loc.endereco?.cidade ||
                                                        "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 border-slate-800  p-3 rounded-2xl border ">
                                            <Package
                                                size={18}
                                                className="text-amber-500 mt-1"
                                            />
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                                                    Itens da Locação
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {loc.brinquedos?.map(
                                                        (b) => (
                                                            <span
                                                                key={b.id}
                                                                className="bg-slate-800 text-slate-300 px-3 py-1 rounded-lg text-xs font-medium border border-slate-700"
                                                            >
                                                                {formatTitleCase(
                                                                    b.tipo.replaceAll(
                                                                        "-",
                                                                        " ",
                                                                    ),
                                                                )}
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-950/50 p-4 flex md:flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-slate-800 w-full md:w-20">
                                    <button
                                        onClick={() => handleOpenModal(loc)}
                                        className="flex-1 md:flex-none p-3 hover:bg-indigo-500/20 text-indigo-400 rounded-2xl transition-all flex justify-center"
                                    >
                                        <Edit size={20} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setLocacaoIdToDelete(loc.id);
                                            setIsDeleteModalOpen(true);
                                        }}
                                        className="flex-1 md:flex-none p-3 hover:bg-red-500/20 text-red-500 rounded-2xl transition-all flex justify-center"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-24 bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-800">
                            <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                                <Package size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-400">
                                Nenhuma locação encontrada
                            </h3>
                            <p className="text-slate-600 text-sm max-w-xs mx-auto mt-2">
                                Ainda não possui registos ativos ou históricos
                                nesta categoria.
                            </p>
                        </div>
                    )}
                </div>
            </main>
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 text-slate-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">

                        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <div>
                                <h2 className="text-2xl font-black text-white">
                                    {isEditing
                                        ? "Editar Locação"
                                        : "Nova Locação"}
                                </h2>
                                <div className="flex gap-1.5 mt-3">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div
                                            key={i}
                                            className={`h-1.5 w-8 rounded-full transition-all duration-500 ${step >= i ? "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" : "bg-slate-800"}`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="bg-slate-800 p-2 rounded-full text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                            {step === 1 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                                Selecionar Cliente
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowQuickClient(
                                                        !showQuickClient,
                                                    )
                                                }
                                                className="text-indigo-400 text-xs font-bold hover:underline flex items-center gap-1"
                                            >
                                                {showQuickClient ? (
                                                    "Cancelar"
                                                ) : (
                                                    <>
                                                        <UserPlus size={14} />{" "}
                                                        Novo Cliente
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {showQuickClient ? (
                                            <div className="bg-slate-800/50 p-4 rounded-2xl border border-indigo-500/30 space-y-3">
                                                <input
                                                    placeholder="Nome do Cliente"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 outline-none focus:border-indigo-500 text-white"
                                                    value={quickClient.nome}
                                                    onChange={(e) =>
                                                        setQuickClient({
                                                            ...quickClient,
                                                            nome: formatTitleCase(e.target
                                                                .value),
                                                        })
                                                    }
                                                />
                                                <input
                                                    placeholder="Telefone"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 outline-none text-white"
                                                    value={quickClient.numero_celular}
                                                    onChange={(e) =>
                                                        setQuickClient({
                                                            ...quickClient,
                                                            numero_celular:
                                                                maskPhone(e.target.value),
                                                        })
                                                    }
                                                />
                                                <button
                                                    onClick={
                                                        handleQuickClientSubmit
                                                    }
                                                    className="w-full bg-indigo-600 py-2 rounded-xl font-bold text-sm"
                                                >
                                                    Guardar e Selecionar
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="relative">
                                                    <Search
                                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                                                        size={18}
                                                    />
                                                    <input
                                                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-white"
                                                        placeholder="Pesquisar por nome..."
                                                        value={searchTerm}
                                                        onChange={(e) =>
                                                            setSearchTerm(
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div className="grid gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                    {filteredClientes.length >
                                                    0 ? (
                                                        filteredClientes.map(
                                                            (c) => (
                                                                <button
                                                                    key={c.id}
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setFormData(
                                                                            {
                                                                                ...formData,
                                                                                cliente_id:
                                                                                    c.id,
                                                                            },
                                                                        )
                                                                    }
                                                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.cliente_id === c.id ? "bg-indigo-600/20 border-indigo-500 text-white shadow-inner" : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500"}`}
                                                                >
                                                                    <span className="font-bold">
                                                                        {c.nome}
                                                                    </span>
                                                                    {formData.cliente_id ===
                                                                        c.id && (
                                                                        <CheckCircle2
                                                                            size={
                                                                                20
                                                                            }
                                                                            className="text-indigo-400"
                                                                        />
                                                                    )}
                                                                </button>
                                                            ),
                                                        )
                                                    ) : (
                                                        <p className="text-center text-slate-600 text-sm py-4 italic">
                                                            Nenhum cliente
                                                            encontrado.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                            Valor do Contrato
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">
                                                R$
                                            </span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                required
                                                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 pl-12 outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono text-xl text-emerald-400"
                                                placeholder="0,00"
                                                value={formData.valor_total}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        valor_total:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                    <div className="flex items-center gap-3 text-indigo-400 mb-2">
                                        <Calendar size={24} />
                                        <h3 className="text-lg font-bold">
                                            Quando será o evento?
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-slate-500 uppercase">
                                                Data e Hora da Montagem
                                            </label>
                                            <input
                                                type="datetime-local"
                                                required
                                                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500/50 text-white text-lg"
                                                value={formData.data_montagem}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        data_montagem:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-slate-500 uppercase">
                                                Data e Hora da Desmontagem
                                            </label>
                                            <input
                                                type="datetime-local"
                                                required
                                                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500/50 text-white text-lg"
                                                value={formData.data_devolucao}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        data_devolucao:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl flex gap-3 text-indigo-300 text-xs italic">
                                        <Info size={16} className="shrink-0" />
                                        <p>
                                            O sistema verificará o stock
                                            disponível automaticamente para este
                                            período após clicar em continuar.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            <Package className="text-amber-500" />{" "}
                                            Itens Disponíveis
                                        </h3>
                                        <span className="text-xs text-slate-500">
                                            {formData.brinquedos_ids.length}{" "}
                                            selecionados
                                        </span>
                                    </div>

                                    {loadingBrinquedos ? (
                                        <div className="py-20 flex flex-col items-center justify-center space-y-4 text-white">
                                            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                            <p className="animate-pulse">
                                                A verificar stock...
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {brinquedos.length > 0 ? (
                                                brinquedos.map((b) => (
                                                    <label
                                                        key={b.id}
                                                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-4 ${formData.brinquedos_ids.includes(b.id) ? "bg-indigo-600/20 border-indigo-500" : "bg-slate-800/50 border-slate-700 hover:border-slate-600"}`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={formData.brinquedos_ids.includes(
                                                                b.id,
                                                            )}
                                                            onChange={(e) => {
                                                                const ids = e
                                                                    .target
                                                                    .checked
                                                                    ? [
                                                                          ...formData.brinquedos_ids,
                                                                          b.id,
                                                                      ]
                                                                    : formData.brinquedos_ids.filter(
                                                                          (
                                                                              id,
                                                                          ) =>
                                                                              id !==
                                                                              b.id,
                                                                      );
                                                                setFormData({
                                                                    ...formData,
                                                                    brinquedos_ids:
                                                                        ids,
                                                                });
                                                            }}
                                                        />
                                                        <div
                                                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.brinquedos_ids.includes(b.id) ? "bg-indigo-500 text-white" : "bg-slate-700 text-slate-500"}`}
                                                        >
                                                            <Package
                                                                size={20}
                                                            />
                                                        </div>
                                                        <span className="font-bold text-sm text-white">
                                                            {formatTitleCase(
                                                                b.tipo.replaceAll("-", " "),
                                                            )}
                                                        </span>
                                                        {formData.brinquedos_ids.includes(
                                                            b.id,
                                                        ) && (
                                                            <CheckCircle2
                                                                size={18}
                                                                className="text-indigo-400 ml-auto"
                                                            />
                                                        )}
                                                    </label>
                                                ))
                                            ) : (
                                                <div className="col-span-full py-10 text-center bg-slate-800/30 rounded-2xl border border-slate-800 text-slate-500">
                                                    <p>
                                                        Nenhum brinquedo livre
                                                        encontrado para estas
                                                        datas.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {step === 4 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                    <div className="flex items-center gap-3 text-rose-500">
                                        <MapPin size={24} />
                                        <h3 className="text-lg font-bold">
                                            Onde será montado?
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-white">
                                        <input
                                            placeholder="CEP"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none focus:border-rose-500"
                                            value={formData.endereco.cep}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    endereco: {
                                                        ...formData.endereco,
                                                        cep: e.target.value,
                                                    },
                                                })
                                            }
                                        />
                                        <input
                                            placeholder="Rua"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none focus:border-rose-500 col-span-2"
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
                                        <input
                                            placeholder="Nº"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none focus:border-rose-500"
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
                                        <input
                                            placeholder="Bairro"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none focus:border-rose-500 col-span-2"
                                            value={formData.endereco.bairro}
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
                                        <input
                                            placeholder="Cidade"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none focus:border-rose-500 col-span-2"
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
                                        <input
                                            placeholder="UF"
                                            maxLength="2"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none focus:border-rose-500 text-center uppercase"
                                            value={formData.endereco.estado}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    endereco: {
                                                        ...formData.endereco,
                                                        estado: e.target.value,
                                                    },
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            )}

                            {step === 5 && (
                                <div className="space-y-6 text-white animate-in fade-in slide-in-from-right-4">
                                    <div className="text-center">
                                        <CheckCircle2
                                            size={48}
                                            className="text-emerald-500 mx-auto mb-2"
                                        />
                                        <h3 className="text-xl font-black">
                                            Confirme os detalhes
                                        </h3>
                                        <p className="text-slate-500 text-sm">
                                            Verifique se tudo está correto antes
                                            de finalizar.
                                        </p>
                                    </div>
                                    <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700 space-y-4">
                                        <div className="flex justify-between border-b border-slate-700 pb-2">
                                            <span className="text-slate-500 text-xs font-bold uppercase">
                                                Cliente
                                            </span>
                                            <span className="font-bold text-indigo-400">
                                                {clientes.find(
                                                    (c) =>
                                                        c.id ===
                                                        formData.cliente_id,
                                                )?.nome ||
                                                    "Cliente Não Encontrado"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-700 pb-2">
                                            <span className="text-slate-500 text-xs font-bold uppercase">
                                                Valor Total
                                            </span>
                                            <span className="font-mono font-black text-emerald-400">
                                                R$ {formData.valor_total}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-700 pb-2">
                                            <span className="text-slate-500 text-xs font-bold uppercase">
                                                Local
                                            </span>
                                            <span className="text-right text-xs">
                                                {formData.endereco.rua},{" "}
                                                {formData.endereco.numero}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-tighter">
                                                Itens Selecionados (
                                                {formData.brinquedos_ids.length}
                                                )
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {formData.brinquedos_ids
                                                    .length > 0 ? (
                                                    formData.brinquedos_ids.map(
                                                        (id) => {
                                                            const toy =
                                                                brinquedos.find(
                                                                    (b) =>
                                                                        b.id ===
                                                                        id,
                                                                );
                                                            return (
                                                                <span
                                                                    key={id}
                                                                    className="bg-slate-700 px-3 py-1 rounded-lg text-[10px] border border-slate-600"
                                                                >
                                                                    {toy
                                                                        ? toy.tipo.replaceAll("-", " ")
                                                                        : `Brinquedo #${id}`}
                                                                </span>
                                                            );
                                                        },
                                                    )
                                                ) : (
                                                    <span className="text-rose-400 text-xs italic">
                                                        Nenhum item selecionado
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {errorMsg && (
                                        <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex items-center gap-2 text-rose-400 text-xs font-bold">
                                            <AlertCircle size={16} /> {errorMsg}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t border-slate-800 bg-slate-900/80 flex justify-between gap-4">
                            {step > 1 ? (
                                <button
                                    onClick={handlePrevStep}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 py-4 rounded-2xl font-bold transition-colors"
                                >
                                    Voltar
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 py-4 rounded-2xl font-bold transition-colors"
                                >
                                    Cancelar
                                </button>
                            )}

                            {step < 5 ? (
                                <button
                                    onClick={handleNextStep}
                                    disabled={
                                        (step === 1 && !formData.cliente_id || !formData.valor_total) ||
                                        (step === 2 &&
                                            (!formData.data_montagem ||
                                                !formData.data_devolucao))
                                    }
                                    className="flex-2 bg-indigo-600 hover:bg-indigo-700 px-12 py-4 rounded-2xl font-black disabled:opacity-30 disabled:cursor-not-allowed transition-all text-white shadow-lg shadow-indigo-600/20"
                                >
                                    Continuar
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    className="flex-2 bg-emerald-600 hover:bg-emerald-700 px-12 py-4 rounded-2xl font-black transition-all text-white shadow-lg shadow-emerald-600/20"
                                >
                                    Finalizar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-60 text-slate-200">
                    <div className="bg-slate-900 border border-red-500/20 p-10 rounded-[2.5rem] w-full max-w-sm shadow-2xl text-center space-y-6">
                        <div className="bg-red-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-red-500">
                            <Trash2 size={40} />
                        </div>
                        <h2 className="text-2xl font-black">
                            Remover Locação?
                        </h2>
                        <p className="text-slate-500 text-sm italic">
                            Esta ação libertará os brinquedos no stock para
                            estas datas.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={confirmDelete}
                                className="w-full bg-red-600 hover:bg-red-700 py-4 rounded-2xl font-black text-white"
                            >
                                Confirmar
                            </button>
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="w-full bg-slate-800 hover:bg-slate-700 py-4 rounded-2xl font-bold text-slate-400"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
                .animate-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default Locacoes;
