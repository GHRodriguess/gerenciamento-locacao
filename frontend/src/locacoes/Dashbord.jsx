import React, { useState, useEffect } from "react";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
} from "recharts";
import { ArrowLeft, ChevronRight } from "lucide-react"; // Removido ícones não usados para limpar o código
import authFetch from "../utils/AuthFetch";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/NavBar";
import { getMonthlyStats, getTopClients, getToyRanking } from "../utils/dashbord";

const Dashboard = () => {
    const [data, setData] = useState([]);
    const [metrics, setMetrics] = useState({
        totalRevenue: 0,
        activeLocacoes: 0,
        cancelRate: 0,
        lostRevenue: 0,
        topClient: { nome: "-", total: 0 },
        popularToy: "-"
    });
    const navigate = useNavigate();

    const calculateMetrics = (locs) => {
        const total = locs.length;
        const active = locs.filter(l => !l.cancelada);
        const canceled = locs.filter(l => l.cancelada);
        console.log(locs)

        const revenue = active.reduce((acc, curr) => acc + parseFloat(curr.valor_total), 0);
        const lost = canceled.reduce((acc, curr) => acc + parseFloat(curr.valor_total), 0);

        const cancelRate = total > 0 ? ((canceled.length / total) * 100).toFixed(1) : 0;

        const clientsRanking = getTopClients(locs);
        const topClient = clientsRanking.length > 0 
            ? clientsRanking[0] 
            : { nome: "-", total: 0 };

        const toyCount = {};
        active.forEach(l => {
            l.brinquedos.forEach(b => {
                const name = b.tipo.replaceAll("-", " ");
                toyCount[name] = (toyCount[name] || 0) + 1;
            });
        });
        const popularToyName = Object.keys(toyCount).reduce((a, b) => toyCount[a] > toyCount[b] ? a : b, "-");

        setMetrics({
            totalRevenue: revenue,
            lostRevenue: lost,
            activeLocacoes: active.length,
            cancelRate: cancelRate,
            topClient: { nome: topClient.nome, total: topClient.total },
            popularToy: popularToyName
        });
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await authFetch(import.meta.env.VITE_API_URL + "/locacoes/todas");
                if (response.ok) {
                    const json = await response.json();
                    setData(json);
                    calculateMetrics(json);
                }
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
            <Navbar />
            
            <main className="p-6 max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
                <header className="flex items-end justify-between border-b border-white/5 pb-8">
                    <div>
                        <h2 className="text-4xl font-bold tracking-tighter">Visão Geral</h2>
                    </div>
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/10">
                        <ArrowLeft size={16} /> Voltar
                    </button>
                </header>

                {/* Alterado para lg:grid-cols-5 para acomodar o cancelamento */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <MetricCard title="Receita Total" value={`R$ ${metrics.totalRevenue.toLocaleString()}`} subtitle="Líquido arrecadado" color="text-white" />
                    
                    {/* Novo Card de Cancelamento */}
                    <MetricCard title="Cancelamento" value={`${metrics.cancelRate}%`} subtitle={`R$ ${metrics.lostRevenue.toLocaleString()} perdidos`} color="text-red-500" />
                    
                    <MetricCard title="Locações" value={metrics.activeLocacoes} subtitle="Eventos realizados" color="text-blue-500" />
                    <MetricCard className="truncate max-w-full" title="Fidelidade" value={metrics.topClient.nome.split(' ')[0]} subtitle={`${metrics.topClient.total} ${metrics.topClient.total === 1 ? 'locação' : 'locações'}`} color="text-white" />
                    <MetricCard title="Destaque" value={metrics.popularToy.split(' ')[0].charAt(0).toUpperCase() + metrics.popularToy.split(' ')[0].slice(1)} subtitle="Mais pedido" color="text-white" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <section className="lg:col-span-2 bg-zinc-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-lg font-semibold tracking-tight text-zinc-300">Rendimentos e Volume</h3>
                        </div>
                        <div className="h-[80%] min-h-60 flex items-end">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={getMonthlyStats(data)}>
                                    <CartesianGrid strokeDasharray="0" stroke="transparent" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 12}} dy={10} />
                                    <YAxis hide />
                                    <Tooltip 
                                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                        contentStyle={{ backgroundColor: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} 
                                    />
                                    <Bar dataKey="rendimento" fill="#3b82f6" radius={[6, 6, 6, 6]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    <section className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8">
                        <h3 className="text-lg font-semibold mb-6 text-zinc-300">Top Clientes</h3>
                        <div className="space-y-4">
                            {getTopClients(data).map((client, idx) => (
                                <div key={idx} className="flex items-center justify-between group cursor-default">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 text-xs font-bold">
                                            {client.nome.charAt(0)}
                                        </div>
                                        <div className="w-50">
                                            <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors truncate w-full">{client.nome}</p>
                                            <p className="text-[11px] text-zinc-500 uppercase tracking-widest">{client.total} Reservas</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={14} className="text-zinc-700" />
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8">
                        <h3 className="text-lg font-semibold mb-6 text-zinc-300">Populares</h3>
                        <div className="space-y-6">
                            {getToyRanking(data).slice(0, 4).map((toy, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-400 capitalize">{toy.nome}</span>
                                        <span className="font-mono text-blue-500">{toy.total}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-blue-600 rounded-full" 
                                            style={{ width: `${getToyRanking(data)[0] ? (toy.total / getToyRanking(data)[0].total) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="lg:col-span-2 bg-zinc-900/50 border border-white/5 rounded-3xl p-8 overflow-x-auto">
                        <h3 className="text-lg font-semibold mb-6 text-zinc-300">Relatório Mensal</h3>
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-zinc-500 border-b border-white/5">
                                    <th className="pb-4 font-medium">Mês</th>
                                    <th className="pb-4 font-medium text-right">Volume</th>
                                    <th className="pb-4 font-medium text-right">Faturamento</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {getMonthlyStats(data).map((m, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                        <td className="py-4 text-zinc-200">{m.name}</td>
                                        <td className="py-4 text-right text-zinc-400 font-mono">{m.total} loc.</td>
                                        <td className="py-4 text-right font-semibold text-emerald-400">R$ {m.rendimento.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                </div>
            </main>
        </div>
    );
};

const MetricCard = ({ title, value, subtitle, color }) => (
    <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl hover:border-white/10 transition-all duration-300">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3">{title}</p>
        <p className={`text-3xl font-bold tracking-tight mb-1 ${color}`}>{value}</p>
        <p className="text-[11px] text-zinc-500 leading-tight">{subtitle}</p>
    </div>
);

export default Dashboard;