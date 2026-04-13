import { MapPin, Castle, UserRound } from "lucide-react";

const Locacoes = ({ locacoes = [], onSelect, limit }) => {
    const lista = limit ? locacoes.slice(0, limit) : locacoes;

    return (
        <div className="grid gap-4">
            {lista.length > 0 ? (
                lista.map((loc) => (
                    <div
                        key={loc.id}
                        onClick={() => onSelect(loc)}
                        className="bg-base p-5 rounded-2xl border border-white/20 space-y-3 shadow-lg hover:border-white/20 transition-all cursor-pointer active:scale-95"
                    >
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold text-white flex items-center gap-2 truncate max-w-50 text-lg">
                                <UserRound
                                    size={20}
                                    className="shrink-0 text-white"
                                />
                                <span className="truncate">
                                    {loc.cliente.nome}
                                </span>
                            </h4>
                            <span className="text-emerald-400 font-bold bg-emerald-400/10 px-3 py-1 rounded-lg text-sm">
                                R$ {loc.valor_total}
                            </span>
                        </div>

                        <div className="flex items-start gap-2 text-slate-300">
                            <MapPin size={16} className="text-blue-500 mt-1" />
                            <p className="text-sm font-medium">
                                {loc.endereco.rua}, {loc.endereco.numero}
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-white/20">
                            <div className="flex gap-4 text-[11px] font-semibold">
                                <span className="text-blue-400">
                                    {new Date(loc.data_montagem).toLocaleString(
                                        "pt-BR",
                                    )}
                                </span>
                                <span className="text-red-500">
                                    {new Date(
                                        loc.data_devolucao,
                                    ).toLocaleString("pt-BR")}
                                </span>
                            </div>

                            <div className="flex -space-x-2">
                                {loc.brinquedos.map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-6 h-6 rounded-full bg-base border-2 border-slate-900 flex items-center justify-center"
                                    >
                                        <Castle size={12} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="bg-base p-8 rounded-2xl border border-dashed border-white/20 text-center">
                    <p className="text-white/90">Nenhuma locação encontrada.</p>
                </div>
            )}
        </div>
    );
};

export default Locacoes;
