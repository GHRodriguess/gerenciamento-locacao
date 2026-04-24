import { createBrowserRouter, RouterProvider, Link } from "react-router-dom";
import Login from "./auth/Login.jsx";
import Logout from "./auth/Logout.jsx";
import RedefinirSenha from "./auth/RedefinirSenha.jsx";
import Home from "./locacoes/Home.jsx";
import Colaboradores from "./locacoes/Colaboradores.jsx";
import Brinquedos from "./locacoes/Brinquedos.jsx";
import Clientes from "./locacoes/Clientes.jsx";
import Locacoes from "./locacoes/Locacoes.jsx";
import Dashboard from "./locacoes/Dashbord.jsx";
import PublicLocacao from "./locacoes/PublicLocacao.jsx";

const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />,
    },
    {
        path: "/locacao/:uuid",
        element: <PublicLocacao />,
    },
    {
        path: "/logout",
        element: <Logout />,
    },
    {
        path: "/redefinir-senha/:uid/:token",
        element: <RedefinirSenha />,
    },
    {
        path: "/",
        element: <Home />,
    },
    {
        path: "/colaboradores",
        element: <Colaboradores />,
    },
    {
        path: "/brinquedos",
        element: <Brinquedos />,
    },
    {
        path: "/clientes",
        element: <Clientes />,
    },
    {
        path: "/locacoes",
        element: <Locacoes />,
    },
    {
        path: "/dashbord",
        element: <Dashboard/>
    }
]);

function App() {
    return <RouterProvider router={router} />;
}

export default App;
