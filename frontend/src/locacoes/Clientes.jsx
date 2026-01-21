import React, { useState, useEffect } from "react";
import Navbar from "../components/NavBar";
import authFetch from "../auth/utils/AuthFetch";
import { X } from "lucide-react";
import Toast from "../components/Toast";

const Clientes = () => {
    const [clientes, setClientes] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [deleteError, setDeleteError] = useState("");

    const [formData, setFormData] = useState({
        nome: "",
        numero_celular: "",
        locacoes: [],
    });

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [clientNameToDelete, setClientNameToDelete] = useState("");
    const [clientIdToDelete, setClientIdToDelete] = useState(null);
    const [toast, setToast] = useState({isOpen: false, message: "", type: "sucess"})

    const showToast = (message, type = "success") => {
        setToast({ isOpen: true, message, type });
    };

    const maskPhone = (value) => {
        if (!value) return "";
        value = value.replace(/\D/g, "");
        value = value.replace(/(\d{2})(\d)/, "($1) $2");
        value = value.replace(/(\d{5})(\d)/, "$1-$2");
        return value.substring(0, 15);
    };

    const fetchClientes = async () => {
        try {
            const response = await authFetch(
                import.meta.env.VITE_API_URL + "/clientes/",
            );
            if (response.ok) {
                const data = await response.json();
                setClientes(data);
            }
        } catch (error) {
            console.error("Erro ao buscar clientes:", error);
        }
    };

    useEffect(() => {
        fetchClientes();
    }, []);

    const clientesFiltrados = clientes.filter(
        (cliente) =>
            cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cliente.numero_celular.includes(searchTerm),
    );

    const handleOpenModal = (cliente = null) => {
        if (cliente) {
            setIsEditing(true);
            setCurrentId(cliente.id);
            setFormData({
                nome: cliente.nome,
                numero_celular: cliente.numero_celular,
                locacoes: cliente.locacoes,
            });
        } else {
            setIsEditing(false);
            setFormData({ nome: "", numero_celular: "", locacoes: [] });
        }
        setIsModalOpen(true);
    };

    const formatTitleCase = (value) => {
        if (!value) return "";
        return value
            .toLowerCase()
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const method = isEditing ? "PATCH" : "POST";
        const url = isEditing
            ? `${import.meta.env.VITE_API_URL}/clientes/${currentId}/`
            : `${import.meta.env.VITE_API_URL}/clientes/`;

        try {
            const response = await authFetch(url, {
                method: method,
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setIsModalOpen(false);
                fetchClientes();
                const mensagem = isEditing ? "Cliente editado com sucesso" : "Cliente criado com sucesso"
                showToast(mensagem, "info")
            }
        } catch (error) {
            console.error("Erro na operação:", error);
            const mensagem = isEditing ? "Erro ao editar cliente" : "Erro ao criar cliente"
            showToast(mensagem, "error")
        }
    };

    const openDeleteModal = (nome, id) => {
        setClientNameToDelete(nome);
        setClientIdToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        setDeleteError("");

        try {
            const response = await authFetch(
                `${import.meta.env.VITE_API_URL}/clientes/${clientIdToDelete}/`,
                { method: "DELETE" },
            );

            if (response.ok) {
                fetchClientes();
                setIsDeleteModalOpen(false);                    
                showToast("Usuário deletado com sucesso", "info")
                return;
            }

            const data = await response.json();

            if (response.status === 409) {
                setDeleteError(data.message);                
            }
        } catch (error) {
            console.error(error)
            setDeleteError("Erro inesperado ao remover cliente.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
            <Navbar setIsMenuOpen isMenuOpen />

            <main className="p-4 max-w-4xl mx-auto space-y-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <h1 className="text-2xl font-bold">Clientes</h1>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        + Novo Cliente
                    </button>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        placeholder="Pesquisar por nome ou celular..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 pl-11 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 absolute left-4 top-3.5 text-slate-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>

                <div className="grid gap-4">
                    {clientesFiltrados.length > 0 ? (
                        clientesFiltrados.map((cliente) => (
                            <div
                                key={cliente.id}
                                className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center"
                            >
                                <div>
                                    <p className="font-semibold text-lg">
                                        {cliente.nome}
                                    </p>
                                    <p className="text-slate-400 text-sm">
                                        {cliente.numero_celular} |
                                        <span className="ml-2 text-indigo-400">
                                            {cliente.locacoes?.length || 0}{" "}
                                            Locações
                                        </span>
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <a
                                        href={`https://wa.me/${cliente.numero_celular.replace(/\D/g, "")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-slate-500 hover:text-green-500 hover:bg-green-500/10 rounded-lg transition-all"
                                        title="Enviar mensagem"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                        >
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.431 5.63 1.432h.006c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                        </svg>
                                    </a>
                                    <button
                                        onClick={() => handleOpenModal(cliente)}
                                        className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
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
                                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                            />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() =>
                                            openDeleteModal(
                                                cliente.nome,
                                                cliente.id,
                                            )
                                        }
                                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
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
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-slate-500 py-10">
                            {searchTerm
                                ? "Nenhum cliente corresponde à sua pesquisa."
                                : "Nenhum cliente cadastrado."}
                        </p>
                    )}
                </div>
            </main>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">
                            {isEditing ? "Editar Cliente" : "Novo Cliente"}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm mb-1 text-slate-400">
                                    Nome Completo
                                </label>
                                <input
                                    required
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.nome}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            nome: formatTitleCase(
                                                e.target.value,
                                            ),
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-slate-400">
                                    Celular
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder="(99) 99999-9999"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.numero_celular}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            numero_celular: maskPhone(
                                                e.target.value,
                                            ),
                                        })
                                    }
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() =>  setIsModalOpen(false)                         
                                    }
                                    className="px-4 py-2 text-slate-400"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg"
                                >
                                    {isEditing ? "Atualizar" : "Salvar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-60">
                    <div className="bg-slate-900 border border-red-500/30 p-8 rounded-3xl w-full max-w-sm shadow-2xl text-center">
                        <h2 className="text-xl font-bold text-white mb-2">
                            Remover Cliente
                        </h2>
                        <p className="text-slate-400 mb-8">
                            Deseja remover {clientNameToDelete}?
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={confirmDelete}
                                className="w-full bg-red-600 py-3 rounded-xl font-bold"
                            >
                                Sim, remover
                            </button>
                            <button
                                onClick={() => {setIsDeleteModalOpen(false); setDeleteError("");}}
                                className="w-full bg-slate-800 py-3 rounded-xl"
                            >
                                Cancelar
                            </button>
                            {deleteError && (
                                <p className="text-red-400 text-sm">
                                    {deleteError}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <Toast 
                isOpen={toast.isOpen} 
                message={toast.message} 
                type={toast.type} 
                onClose={() => setToast({ ...toast, isOpen: false })} 
            />
        </div>
    );
};

export default Clientes;
