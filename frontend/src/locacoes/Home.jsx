import React, { useState, useEffect } from "react";
import { Menu, X, Calendar as CalendarIcon, MapPin } from "lucide-react";
import authFetch from "../auth/utils/AuthFetch"

const Home = () => {
    const [username, setUserName] = useState("Carregando...");
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await authFetch(
                    import.meta.env.VITE_API_URL + "/users/me/"
                );
                
                if (response.ok) {
                    const data = await response.json();                    
                    setUserName(data.name || data.username || "Usuário");
                }
            } catch (error) {
                console.error("Erro ao buscar usuário:", error);
            }
        };

        fetchUserData();
    }, []); 

    const locacoes = [
        { id: 1, nome: "Espaço Kids CPM", status: "Ocupado" },
        { id: 2, nome: "Salão Principal", status: "Livre" },
    ];



    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">

            <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-white tracking-tight">
                        Gerenciamento de Locações
                    </h1>

                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>

                {isMenuOpen && (
                    <div className="absolute top-16 left-0 w-full bg-slate-900 border-b border-slate-800 flex flex-col p-4 space-y-4 animate-in slide-in-from-top duration-300">
                        <a
                            href="#"
                            className="py-2 px-4 hover:bg-slate-800 rounded-lg"
                        >
                            Perfil
                        </a>
                        <a
                            href="#"
                            className="py-2 px-4 hover:bg-slate-800 rounded-lg"
                        >
                            Configurações
                        </a>
                        <a
                            href="#"
                            className="py-2 px-4 text-red-400 hover:bg-slate-800 rounded-lg"
                        >
                            Sair
                        </a>
                    </div>
                )}
            </nav>

            <main className="p-4 max-w-lg mx-auto space-y-8">
                <section>
                    <h2 className="text-3xl font-bold text-white">
                        Olá, {username && username.charAt(0).toUpperCase() + username.slice(1)}
                    </h2>
                    <p className="text-slate-400">
                        Gerencie suas locações e agenda.
                    </p>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <MapPin size={20} className="text-blue-500" />{" "}
                            Locações próximas
                        </h3>
                        <span className="text-xs text-blue-400 uppercase font-bold">
                            Ver todas
                        </span>
                    </div>

                    <div className="grid gap-3">
                        {locacoes.map((loc) => (
                            <div
                                key={loc.id}
                                className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center shadow-md"
                            >
                                <span className="font-medium">{loc.nome}</span>
                                <span
                                    className={`text-xs px-2 py-1 rounded-full ${
                                        loc.status === "Livre"
                                            ? "bg-green-900/30 text-green-400"
                                            : "bg-red-900/30 text-red-400"
                                    }`}
                                >
                                    {loc.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="space-y-4 pb-10">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <CalendarIcon size={20} className="text-blue-500" />{" "}
                        Calendário
                    </h3>

                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-bold">Janeiro 2026</span>
                            <div className="flex gap-2">
                                <button className="p-1 hover:bg-slate-800 rounded">
                                    {"<"}
                                </button>
                                <button className="p-1 hover:bg-slate-800 rounded">
                                    {">"}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-500 mb-2">
                            <div>DOM</div>
                            <div>SEG</div>
                            <div>TER</div>
                            <div>QUA</div>
                            <div>QUI</div>
                            <div>SEX</div>
                            <div>SAB</div>
                        </div>

                        <div className="grid grid-cols-7 text-center gap-1">
                            {[...Array(31)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`py-3 rounded-lg text-sm transition-colors cursor-pointer
                    ${
                        i + 1 === 16
                            ? "bg-blue-600 text-white font-bold"
                            : "hover:bg-slate-800 text-slate-300"
                    }`}
                                >
                                    {i + 1}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Home;
