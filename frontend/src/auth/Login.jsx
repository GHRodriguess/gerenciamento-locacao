import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const response = await fetch(import.meta.env.VITE_API_URL + "/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: username,
                password: password,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            if (
                data.detail ===
                "No active account found with the given credentials"
            ) {
                setError("Usuário ou senha incorretos");
            } else {
                setError("Erro desconhecido");
            }
            console.error("Erro no login:", data);
            return;
        }

        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-base flex flex-col items-center justify-center p-6 text-slate-200">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-white">
                        Bem-vindo de volta
                    </h2>
                    <p className="mt-2 text-sm text-white/70">
                        Faça login para acessar sua conta
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="mt-8 space-y-5 bg-base p-8 rounded-2xl border border-white/20 backdrop-blur-sm shadow-xl"
                >
                    <div>
                        <label
                            className="block text-sm font-medium mb-2"
                            htmlFor="username"
                        >
                            Nome de Usuário
                        </label>
                        <input
                            id="username"
                            type="username"
                            required
                            className="w-full px-4 py-3 bg-base border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-white/90"
                            placeholder="Nome de Usuário"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div>
                        <label
                            className="block text-sm font-medium mb-2"
                            htmlFor="password"
                        >
                            Senha
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            className="w-full px-4 py-3 bg-base border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-white/90"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98]"
                    >
                        Entrar
                    </button>
                    {error && (
                        <div className="flex justify-center mt-4">
                            <div className="flex items-center gap-2 bg-red-500/15 border border-red-500 text-red-400 px-4 py-3 rounded-lg shadow-md backdrop-blur-sm">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-8-4a1 1 0 00-.993.883L9 7v3a1 1 0 001.993.117L11 10V7a1 1 0 00-1-1zm0 8a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
                                        clipRule="evenodd"
                                    />
                                </svg>

                                <span className="text-sm font-medium">
                                    {error}
                                </span>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default Login;
