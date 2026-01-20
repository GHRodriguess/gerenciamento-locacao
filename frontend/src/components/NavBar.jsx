import {useState} from "react"
import { Menu, X } from "lucide-react";

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    return (
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
                        href="/"
                        className="py-2 px-4 hover:bg-slate-800 rounded-lg"
                    >
                        Página Inicial
                    </a>
                    <a
                        href="/locacoes"
                        className="py-2 px-4 hover:bg-slate-800 rounded-lg"
                    >
                        Locações
                    </a>
                    <a
                        href="/brinquedos"
                        className="py-2 px-4 hover:bg-slate-800 rounded-lg"
                    >
                        Brinquedos
                    </a>

                    <a
                        href="/clientes"
                        className="py-2 px-4 hover:bg-slate-800 rounded-lg"
                    >
                        Clientes
                    </a>
                    <a
                        href="colaboradores"
                        className="py-2 px-4 hover:bg-slate-800 rounded-lg"
                    >
                        Colaboradores
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
    );
};

export default Navbar;
