import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import Navbar from "../components/NavBar";
import authFetch from "../auth/utils/AuthFetch";
import Toast from "../components/Toast";

const Brinquedos = () => {
    const [brinquedos, setBrinquedos] = useState([]);
    const [viewMode, setViewMode] = useState("todos");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [brinquedoToDelete, setBrinquedoToDelete] = useState(null);
    const [dateError, setDateError] = useState("");
    const [formData, setFormData] = useState({
        tipo: "cama-elastica-2,49-metros",
        ativo: true,
    });

    const [dates, setDates] = useState({ inicio: "", fim: "" });

    const [toast, setToast] = useState({
        isOpen: false,
        message: "",
        type: "sucess",
    });

    const showToast = (message, type = "success") => {
        setToast({ isOpen: true, message, type });
        setTimeout(() => {
            setToast((prev) => ({ ...prev, isOpen: false }));
        }, 3000);
    };

    const fetchBrinquedos = async (urlSuffix = "/brinquedos/") => {
        try {
            const response = await authFetch(
                import.meta.env.VITE_API_URL + urlSuffix,
            );
            if (response.ok) {
                const data = await response.json();
                setBrinquedos(data);
            }
        } catch (error) {
            console.error("Erro ao buscar brinquedos:", error);
        }
    };

    useEffect(() => {
        fetchBrinquedos();
    }, []);

    const formatWithTimezone = (dateString) => {
        if (!dateString) return "";
        return `${dateString}:00-03:00`;
    };

    const checkAvailability = async (e) => {
        e.preventDefault();
        setDateError("");
        if (!dates.inicio || !dates.fim) return;
        const inicioFormatado = formatWithTimezone(dates.inicio);
        const fimFormatado = formatWithTimezone(dates.fim);
        if (fimFormatado <= inicioFormatado) {
            setDateError("A data de fim deve ser posterior à data de início.");
            return;
        }

        const query = `/brinquedos/disponiveis/?inicio=${inicioFormatado}&fim=${fimFormatado}`;
        fetchBrinquedos(query);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await authFetch(
                import.meta.env.VITE_API_URL + "/brinquedos/",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                },
            );

            if (response.ok) {
                setIsModalOpen(false);
                setFormData({ tipo: "cama-elastica-2,49-metros", ativo: true });
                fetchBrinquedos();
                showToast("Brinquedo criado com sucesso", "info");
            }
        } catch (error) {
            console.error("Erro ao criar:", error);
            showToast("Erro ao criar brinquedo", "error");
        }
    };

    const confirmDelete = async () => {
        try {
            const response = await authFetch(
                `${import.meta.env.VITE_API_URL}/brinquedos/${brinquedoToDelete.id}/`,
                {
                    method: "DELETE",
                },
            );
            if (response.ok) {
                fetchBrinquedos();
                setIsDeleteModalOpen(false);
                showToast("Brinquedo deletado com sucesso", "info");
            }
        } catch (error) {
            console.error("Erro ao deletar:", error);
            showToast("Erro ao deletar brinquedo", "error");
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
            <Navbar setIsMenuOpen isMenuOpen />

            <main className="p-4 max-w-4xl mx-auto space-y-6">
                <div className="space-y-6 border-b border-slate-800 pb-8">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between w-full">
                        <div className="relative flex p-1 bg-slate-900/50 border border-slate-800 rounded-xl backdrop-blur-sm w-full md:max-w-md">
                            <div
                                className="absolute top-1 bottom-1 rounded-lg bg-indigo-600 shadow-md shadow-indigo-500/20 transition-all duration-300 ease-in-out z-0"
                                style={{
                                    width: "calc(50% - 6px)",
                                    left:
                                        viewMode === "todos"
                                            ? "4px"
                                            : "calc(50% + 2px)",
                                }}
                            />

                            <button
                                onClick={() => {
                                    setViewMode("todos");
                                    
                                }}
                                className={`relative z-10 flex-1 py-2 text-sm font-medium transition-colors duration-300 ${viewMode === "todos" ? "text-white" : "text-slate-400 hover:text-slate-200"}`}
                            >
                                Todos os Brinquedos
                            </button>

                            <button
                                onClick={() => setViewMode("disponibilidade")}
                                className={`relative z-10 flex-1 py-2 text-sm font-medium transition-colors duration-300 ${viewMode === "disponibilidade" ? "text-white" : "text-slate-400 hover:text-slate-200"}`}
                            >
                                Disponibilidade
                            </button>
                        </div>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-indigo-600  hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 w-full justify-center"
                        >
                            <Plus size={18} /> Novo Brinquedo
                        </button>
                    </div>
                </div>

                {viewMode === "disponibilidade" && (
                    <div className="space-y-4">
                        <form
                            onSubmit={checkAvailability}
                            className="bg-slate-900 border border-indigo-500/20 p-6 rounded-2xl flex flex-wrap items-center gap-4 shadow-xl animate-in fade-in slide-in-from-top-4"
                        >
                            <div className="w-full md:flex-1 px-1 mr-4">
                                <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">
                                    Início (Data e Hora)
                                </label>
                                <input
                                    type="datetime-local"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500 scheme:dark"
                                    onChange={(e) =>
                                        setDates({
                                            ...dates,
                                            inicio: e.target.value,
                                        })
                                    }
                                    value={dates.inicio}
                                    required
                                />
                            </div>
                            <div className="w-full md:flex-1 px-1 mr-4">
                                <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">
                                    Fim (Data e Hora)
                                </label>
                                <input
                                    type="datetime-local"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500 scheme:dark"
                                    onChange={(e) =>
                                        setDates({
                                            ...dates,
                                            fim: e.target.value,
                                        })
                                    }
                                    value={dates.fim}
                                    required
                                />
                            </div>
                            <div>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 rounded-lg font-bold transition-all h-fit"
                                >
                                    Consultar
                                </button>
                            </div>
                        </form>

                        {dateError && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-sm animate-shake">
                                <span className="flex items-center gap-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    {dateError}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid gap-4">
                    {brinquedos.length > 0 ? (
                        brinquedos.map((item) => (
                            <div
                                key={item.id}
                                className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex justify-between items-center hover:border-slate-700 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`w-3 h-3 rounded-full ${item.ativo ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "bg-slate-600"}`}
                                    ></div>
                                    <div>
                                        <p className="font-bold text-lg capitalize">
                                            {item.tipo.replaceAll("-", " ")}
                                        </p>
                                        <p className="text-slate-500 text-sm">
                                            Status:{" "}
                                            {item.ativo
                                                ? "Ativo no sistema"
                                                : "Inativo"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setBrinquedoToDelete(item);
                                        setIsDeleteModalOpen(true);
                                    }}
                                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 rounded-3xl border border-dashed border-slate-800">
                            <p className="text-slate-500">
                                Nenhum brinquedo encontrado para esta seleção.
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-6">
                            Novo Brinquedo
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">
                                    Tipo de Brinquedo
                                </label>
                                <select
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.tipo}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            tipo: e.target.value,
                                        })
                                    }
                                >
                                    <option value="cama-elastica-2,49-metros">
                                        Cama Elástica - 2,49 metros
                                    </option>
                                    <option value="cama-elastica-3-metros">
                                        Cama Elástica - 3 metros
                                    </option>
                                    <option value="cama-elastica-5-metros">
                                        Cama Elástica - 5 metros
                                    </option>
                                    <option value="piscina-de-bolinhas">
                                        Piscina de Bolinhas
                                    </option>
                                </select>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                                <input
                                    type="checkbox"
                                    id="ativo"
                                    className="w-5 h-5 accent-indigo-500"
                                    checked={formData.ativo}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            ativo: e.target.checked,
                                        })
                                    }
                                />
                                <label
                                    htmlFor="ativo"
                                    className="text-sm font-medium text-slate-300"
                                >
                                    Disponível para locação
                                </label>
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-indigo-600/20"
                                >
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-60">
                    <div className="bg-slate-900 border border-red-500/30 p-8 rounded-3xl w-full max-w-sm shadow-2xl text-center">
                        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-8 w-8"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold mb-2">
                            Remover Brinquedo
                        </h2>
                        <p className="text-slate-400 mb-8 text-sm italic">
                            Esta ação excluirá permanentemente o item "
                            {brinquedoToDelete?.tipo}".
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={confirmDelete}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-600/20 active:scale-95 transition-all"
                            >
                                Remover
                            </button>
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="w-full bg-slate-800 text-slate-300 py-3 rounded-xl transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {toast.isOpen && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, isOpen: false })}
                />
            )}
        </div>
    );
};

export default Brinquedos;
