import React, { useState, useEffect } from "react";
import {
    X,
    Calendar as CalendarIcon,
    MapPin,
    Package,
    Clock,
    Castle,
    User
} from "lucide-react";
import authFetch from "../auth/utils/AuthFetch";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/NavBar";
import Locacoes from "../components/Locacoes";


const Home = () => {
    const [username, setUserName] = useState("Carregando...");
    const [locacoes, setLocacoes] = useState([]);
    const [selectedLoc, setSelectedLoc] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const user = localStorage.getItem("username");
                if (user) {
                    setUserName(user);
                    return;
                }
                const response = await authFetch(
                    import.meta.env.VITE_API_URL + "/users/me/",
                );
                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem("username", data.first_name);
                    setUserName(data.first_name || "Usuário");
                }
            } catch (error) {
                console.error(error);
            }
        };

        const fetchLocacoesData = async () => {
            try {
                const response = await authFetch(
                    import.meta.env.VITE_API_URL + "/locacoes",
                );
                if (response.ok) {
                    const data = await response.json();
                    setLocacoes(data);
                }
            } catch (error) {
                console.error(error);
            }
        };

        fetchUserData();
        fetchLocacoesData();
    }, [navigate]);

    const locacoesProximas = locacoes.filter((loc) => {        
        return loc.data_devolucao
            ? new Date(loc.data_devolucao) >= new Date()
            : true;
    });


    const openDetails = (loc) => {
        setSelectedLoc(loc);
        setIsDetailsOpen(true);
    };

    const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1)); 
    const [isDayModalOpen, setIsDayModalOpen] = useState(false);
    const [locacoesDoDia, setLocacoesDoDia] = useState([]);

    const changeMonth = (offset) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
        setCurrentDate(newDate);
    };

    const generateCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1).getDay(); 
        const daysInMonth = new Date(year, month + 1, 0).getDate(); 

        const days = [];

        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        return days;
    };

    const handleDiaClick = (dia) => {
        if (!dia) return;
        
        const filtradas = locacoes.filter(loc => {
            const d = new Date(loc.data_montagem);
            return d.getDate() === dia && 
                d.getMonth() === currentDate.getMonth() && 
                d.getFullYear() === currentDate.getFullYear();
        });

        setLocacoesDoDia(filtradas);
        setIsDayModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
            <Navbar setIsMenuOpen isMenuOpen />

            <main className="p-4 max-w-lg mx-auto space-y-8">
                <section>
                    <h2 className="text-3xl font-bold text-white">
                        Olá,{" "}
                        {username &&
                            username.charAt(0).toUpperCase() +
                                username.slice(1)}
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
                        <a href="/locacoes" className="text-xs text-blue-400 uppercase font-bold cursor-pointer hover:text-blue-300">
                            Ver todas
                        </a>
                    </div>

                    
                    <Locacoes locacoes={locacoesProximas} onSelect={openDetails} limit={2}/>
                    
                </section>

                <section className="space-y-4 pb-10">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <CalendarIcon size={20} className="text-blue-500" /> Calendário
                    </h3>

                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <span className="font-bold text-white capitalize">
                                {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                            </span>
                            <div className="flex gap-1">
                                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
                                    {"<"}
                                </button>
                                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
                                    {">"}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-500 mb-2">
                            <div>DOM</div><div>SEG</div><div>TER</div><div>QUA</div><div>QUI</div><div>SEX</div><div>SAB</div>
                        </div>
                        <div className="grid grid-cols-7 text-center gap-1">
                            {generateCalendarDays().map((dia, i) => {
                                if (dia === null) return <div key={`empty-${i}`} className="p-3"></div>;

                                const possuiEvento = locacoes?.some(loc => {
                                    const d = new Date(loc.data_montagem);
                                    return d.getDate() === dia && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
                                });

                                const isHoje = new Date().getDate() === dia && new Date().getMonth() === currentDate.getMonth();

                                return (
                                    <div
                                        key={i}
                                        onClick={() => handleDiaClick(dia)}
                                        className={`py-3 rounded-xl text-sm transition-all cursor-pointer relative
                                            ${isHoje ? "bg-blue-600 text-white font-bold" : "hover:bg-slate-800 text-slate-300"}
                                            ${possuiEvento && !isHoje ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : ""}
                                        `}
                                    >
                                        {dia}
                                        {possuiEvento && (
                                            <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isHoje ? 'bg-white' : 'bg-indigo-500'}`}></span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </main>
            {isDetailsOpen && selectedLoc && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <div className="bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-800 shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Package className="text-indigo-500" /> Detalhes
                                da Locação
                            </h2>
                            <button
                                onClick={() => setIsDetailsOpen(false)}
                                className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex flex-col justify-center">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-widest">
                                        Cliente
                                    </p>
                                    <p className="text-white font-bold text-lg leading-tight">
                                        {selectedLoc.cliente.nome}
                                    </p>
                                </div>

                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-widest">
                                        Valor Total
                                    </p>
                                    <p className="font-bold text-emerald-400 text-2xl">
                                        R$ {selectedLoc.valor_total}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <a 
                                    href={`https://wa.me/55${selectedLoc.cliente.numero_celular.replace(/\D/g, '')}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-between bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 p-4 rounded-xl transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-emerald-500 text-slate-950 p-1.5 rounded-lg">
                                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.431 5.63 1.432h.006c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                            </svg>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-emerald-500/80 font-bold uppercase tracking-tighter">Enviar mensagem</span>
                                            <span className="text-white font-medium">{selectedLoc.cliente.numero_celular}</span>
                                        </div>
                                    </div>
                                    <X size={18} className="text-emerald-500 -rotate-135" />
                                </a>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <MapPin size={16} /> Local de Montagem
                                </h3>
                                <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-800">
                                    <p className="text-white font-medium">
                                        {selectedLoc.endereco.rua},{" "}
                                        {selectedLoc.endereco.numero}
                                    </p>
                                    <p className="text-slate-400 text-sm">
                                        {selectedLoc.endereco.bairro}
                                    </p>
                                    <p className="text-slate-400 text-sm">
                                        {selectedLoc.endereco.cidade} -{" "}
                                        {selectedLoc.endereco.estado || "PR"}
                                    </p>
                                    {selectedLoc.endereco.complemento && (
                                        <p className="text-indigo-400 text-xs mt-1 italic">
                                            Obs:{" "}
                                            {selectedLoc.endereco.complemento}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={16} /> Cronograma
                                </h3>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl">
                                        <p className="text-[10px] text-blue-400 font-bold uppercase">
                                            Montagem
                                        </p>
                                        <p className="text-sm font-bold text-blue-200">
                                            {new Date(
                                                selectedLoc.data_montagem,
                                            ).toLocaleString("pt-BR")}
                                        </p>
                                    </div>
                                    <div className="flex-1 bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl">
                                        <p className="text-[10px] text-orange-400 font-bold uppercase">
                                            Retirada
                                        </p>
                                        <p className="text-sm font-bold text-orange-200">
                                            {new Date(
                                                selectedLoc.data_devolucao,
                                            ).toLocaleString("pt-BR")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                    Brinquedos ({selectedLoc.brinquedos.length})
                                </h3>
                                <div className="grid gap-2">
                                    {selectedLoc.brinquedos.map((b, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-3 bg-slate-800 p-3 rounded-xl border border-slate-700"
                                        >
                                            <div className="w-10 h-10rounded-lg flex items-center justify-center text-xl">
                                                <Castle />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white capitalize">
                                                    {b.tipo?.replaceAll(
                                                        "-",
                                                        " ",
                                                    )}
                                                </p>
                                                <p className="text-[10px] text-slate-500 uppercase">
                                                    Patrimônio: {b.id || "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 p-4 border-t border-slate-800">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <User size={14} /> Registro
                            </h3>
                            <div className="flex items-center gap-2">
                                <div className="bg-slate-800/50 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-indigo-400 border border-slate-700">
                                    {selectedLoc.criado_por?.username?.charAt(0).toUpperCase() || "U"}
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400">
                                        Criado por: <span className="text-white font-medium">{ selectedLoc.criado_por?.username || "Sistema"}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-2 pb-5">
                            <button
                                onClick={() => setIsDetailsOpen(false)}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all"
                            >
                                Fechar Detalhes
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isDayModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-60 p-4">
                    <div className="bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
                            <h3 className="font-bold text-lg">Locações do dia</h3>
                            <button onClick={() => setIsDayModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                            {locacoesDoDia.length > 0 ? (
                                locacoesDoDia.map(loc => (
                                    <div 
                                        key={loc.id}
                                        onClick={() => { setIsDayModalOpen(false); openDetails(loc); }}
                                        className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-indigo-500 transition-colors cursor-pointer"
                                    >
                                        <p className="font-bold text-sm">Cliente {loc.cliente.nome}</p>
                                        <p className="text-xs text-slate-400 truncate">{loc.endereco.rua}, {loc.endereco.numero}</p>
                                        <div className="flex justify-between mt-2 text-[10px] font-bold text-indigo-400">
                                            <span>Montagem: {new Date(loc.data_montagem).getHours()}h</span>
                                            <span>R$ {loc.valor_total}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-slate-500 py-4">Nenhuma locação para este dia.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
