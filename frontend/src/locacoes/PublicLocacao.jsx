import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { 
    Calendar, 
    MapPin, 
    Package, 
    User, 
    CheckCircle2,
    Castle,
    AlertCircle
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const PublicLocacao = () => {
    const { uuid } = useParams();
    const [locacao, setLocacao] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchPublicLocacao = async () => {
            try {
                const response = await fetch(`${API_URL}/locacoes/publica/${uuid}/`);
                if (response.ok) {
                    const data = await response.json();
                    setLocacao(data);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error("Erro ao buscar locação pública:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchPublicLocacao();
    }, [uuid]);

    const formatTitleCase = (str) => {
        if (!str) return "";
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-base flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (error || !locacao) {
        return (
            <div className="min-h-screen bg-base flex items-center justify-center p-4">
                <div className="bg-base border border-white/20 p-8 rounded-[2.5rem] max-w-md w-full text-center space-y-4">
                    <AlertCircle size={48} className="text-red-500 mx-auto" />
                    <h1 className="text-2xl font-bold text-white">Locação não encontrada</h1>
                    <p className="text-slate-400">O link pode estar expirado ou incorreto.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base py-12 px-4 flex justify-center">
            <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-2">
                    <div className="bg-indigo-500/10 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                        <CheckCircle2 size={32} className="text-indigo-500" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Resumo da Locação</h1>
                    <p className="text-slate-400 font-medium">Informações detalhadas do seu pedido</p>
                </div>

                <div className="bg-base border border-white/20 rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <div className="p-8 space-y-8">
                        {/* Header Cliente */}
                        <div className="flex justify-between items-start border-b border-white/10 pb-8">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Cliente</p>
                                <div className="flex items-center gap-2">
                                    <User size={20} className="text-slate-400" />
                                    <h2 className="text-2xl font-bold text-white">{locacao.cliente.nome}</h2>
                                </div>
                            </div>
                            <div className="text-right space-y-1">
                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Total</p>
                                <p className="text-3xl font-black text-emerald-400 font-mono">R$ {locacao.valor_total}</p>
                            </div>
                        </div>

                        {/* Detalhes Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-3">
                                <div className="flex items-center gap-2 text-indigo-400">
                                    <Calendar size={18} />
                                    <p className="text-xs font-bold uppercase tracking-wider">Período</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400 font-medium">Montagem:</span>
                                        <span className="text-white font-bold">
                                            {new Date(locacao.data_montagem).toLocaleString("pt-BR", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400 font-medium">Devolução:</span>
                                        <span className="text-white font-bold">
                                            {new Date(locacao.data_devolucao).toLocaleString("pt-BR", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-3">
                                <div className="flex items-center gap-2 text-rose-400">
                                    <MapPin size={18} />
                                    <p className="text-xs font-bold uppercase tracking-wider">Local da Festa</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-white font-bold text-sm leading-relaxed">
                                        {locacao.endereco.rua}, {locacao.endereco.numero}
                                    </p>
                                    <p className="text-slate-400 text-xs font-medium uppercase tracking-tight">
                                        {locacao.endereco.cidade}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Brinquedos */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-amber-400">
                                <Package size={18} />
                                <p className="text-xs font-bold uppercase tracking-wider">Itens Contratados</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {locacao.brinquedos.map((b) => (
                                    <div key={b.id} className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                                        <div className="bg-indigo-500/20 p-2 rounded-xl border border-indigo-500/30">
                                            <Castle size={16} className="text-indigo-400" />
                                        </div>
                                        <span className="text-slate-200 font-bold text-sm">
                                            {formatTitleCase(b.tipo.replaceAll("-", " "))}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-600/10 p-6 border-t border-white/10 text-center">
                        <p className="text-xs text-indigo-400/80 font-bold uppercase tracking-[0.2em]">Obrigado pela preferência!</p>
                    </div>
                </div>

                <div className="text-center text-slate-500 text-xs font-medium">
                    Gerado automaticamente por Sistema de Locação
                </div>
            </div>
        </div>
    );
};

export default PublicLocacao;
