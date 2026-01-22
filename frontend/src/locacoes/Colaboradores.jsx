import React, { useState, useEffect } from "react";
import Navbar from "../components/NavBar";
import authFetch from "../auth/utils/AuthFetch";
import Toast from "../components/Toast";

const Colaboradores = () => {
    const [colaboradores, setColaboradores] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
    });
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [usernameToDelete, setUsernameToDelete] = useState(null);
    const [userId, setUseridToDelete] = useState(null);
    const [toast, setToast] = useState({isOpen: false, message: "", type: "sucess"})

    const showToast = (message, type = "success") => {
        setToast({ isOpen: true, message, type });
    };

    const fetchUsers = async () => {
        try {
            const response = await authFetch(
                import.meta.env.VITE_API_URL + "/users/",
            );
            if (response.ok) {
                const data = await response.json();
                setColaboradores(data);
            }
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
        }
    };
    useEffect(() => {
        fetchUsers();
    }, []);

    const generateRandomPassword = (length = 12) => {
        const charset =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        let password = "";
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            password += charset[randomIndex];
        }
        return password;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                password: generateRandomPassword(16),
            };
            const response = await authFetch(
                import.meta.env.VITE_API_URL + "/users/",
                {
                    method: "POST",
                    body: JSON.stringify(payload),
                },
            );

            if (response.ok) {
                setIsModalOpen(false);
                setFormData({
                    username: "",
                    email: "",
                    first_name: "",
                    last_name: "",
                });
                fetchUsers();
                showToast("Colaborador criado com sucesso", "info")
            } else {
                const errorData = await response.json().catch();
                console.error(errorData);
            }
        } catch (error) {
            showToast("Erro ao criar colaborador", "error")
            console.error("Erro ao criar colaborador:", error);
        }
    };
    const openDeleteModal = (username, userId) => {
        setUsernameToDelete(username);
        setUseridToDelete(userId);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await authFetch(
                `${import.meta.env.VITE_API_URL}/users/${userId}/`,
                {
                    method: "DELETE",
                },
            );

            if (response.ok) {
                fetchUsers();
                setIsDeleteModalOpen(false);
                showToast("Usuário deletado com sucesso", "info")
            }
        } catch (error) {
            console.error("Erro ao deletar:", error);
            showToast("Erro ao deletar", "error")
        }
    };

    const handleEmailResetPassword = async (userid) => {
        try {

            const response = await authFetch(
                `${import.meta.env.VITE_API_URL}/users/${userid}/send_email_reset_password/`,
                {
                    method: "POST"
                }
            )
            if (response.ok) {
                showToast("E-mail de redefinição enviado!", "info")
            }
        }
        catch (error) {
            console.error(error)
            showToast("Erro ao enviar o e-mail", "error")
            throw(error)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
            <Navbar setIsMenuOpen isMenuOpen />

            <main className="p-4 max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <h1 className="text-2xl font-bold">Colaboradores</h1>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        + Criar Colaborador
                    </button>
                </div>

                <div className="grid gap-4">
                    {colaboradores.length > 0 ? (
                        colaboradores.map((user) => (
                            <div
                                key={user.username}
                                className="bg-slate-900 p-4 rounded-xl  border border-slate-800 flex justify-between items-center"
                            >
                                <div>
                                    <p className="font-semibold truncate max-w-60 text-lg">
                                        {user.first_name} {user.last_name}
                                    </p>
                                    <p className="text-slate-400 wrap-normal max-w-60 text-sm">
                                        {user.email} | @{user.username}
                                    </p>
                                </div>
                                <div>
                                    <button
                                        onClick={() => handleEmailResetPassword(user.id)}
                                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                        title="Enviar E-mail Redefinição de Senha para Colaborador"
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
                                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8h18a2 2 0 002-2V8a2 2 0 00-2-2H3a2 2 0 00-2 2v6a2 2 0 002 2z"
                                            />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => openDeleteModal(user.username, user.id)}
                                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                        title="Excluir Colaborador"
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
                        <p className="text-center text-slate-500">
                            Nenhum colaborador encontrado.
                        </p>
                    )}
                </div>
            </main>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">
                            Novo Colaborador
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm mb-1 text-slate-400">
                                    Username
                                </label>
                                <input
                                    required
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.username}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            username: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-sm mb-1 text-slate-400">
                                        Primeiro Nome
                                    </label>
                                    <input
                                        required
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.first_name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                first_name: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm mb-1 text-slate-400">
                                        Sobrenome
                                    </label>
                                    <input
                                        required
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.last_name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                last_name: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-slate-400">
                                    E-mail
                                </label>
                                <input
                                    required
                                    type="email"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            email: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-400 hover:text-white"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg"
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

                        <h2 className="text-xl font-bold text-white mb-2">
                            Remover Colaborador
                        </h2>
                        <p className="text-slate-400 mb-8">
                            Tem certeza que deseja remover{" "}
                            <span className="text-slate-200 font-semibold">
                                @{usernameToDelete}
                            </span>
                            ? Esta ação não pode ser desfeita.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={confirmDelete}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-95"
                            >
                                Sim, remover agora
                            </button>
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl transition-all"
                            >
                                Cancelar
                            </button>
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

export default Colaboradores;
