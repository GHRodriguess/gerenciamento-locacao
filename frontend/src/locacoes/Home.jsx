import React, { useState, useEffect } from "react";
import { Menu, X, Calendar as CalendarIcon, MapPin } from "lucide-react";
import authFetch from "../auth/utils/AuthFetch"
import { useNavigate } from "react-router-dom";
import Navbar from "../components/NavBar";

const Home = () => {
    const [username, setUserName] = useState("Carregando...");
    const navigate = useNavigate()

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const user = localStorage.getItem('username')
                if (user) {
                    setUserName(user)
                    return
                }
                const response = await authFetch(
                    import.meta.env.VITE_API_URL + "/users/me/"
                );
                
                if (response.ok) {
                    const data = await response.json();  
                    console.log(data) 
                    localStorage.setItem('username', data.first_name)                 
                    setUserName(data.first_name || "Usuário");
                }
            } catch (error) {
                console.error("Erro ao buscar usuário, access_token expirado", error);

            }
        };

        fetchUserData();
    }, [navigate]); 

    const locacoes = [
        { id: 1, nome: "Espaço Kids CPM", status: "Ocupado" },
        { id: 2, nome: "Salão Principal", status: "Livre" },
    ];



    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">

            <Navbar setIsMenuOpen isMenuOpen/>

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
