import { createBrowserRouter, RouterProvider, Link } from "react-router-dom";
import Login from "../src/auth/Login.jsx"
import RedefinirSenha from "../src/auth/RedefinirSenha.jsx"
import Home from "../src/locacoes/Home.jsx"
import Colaboradores from "../src/locacoes/Colaboradores.jsx"
import Brinquedos from "./locacoes/Brinquedos.jsx";
import Clientes from "./locacoes/Clientes.jsx"

const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/redefinir-senha/:uid/:token",
        element: <RedefinirSenha/>
    },
    {
        path: "/",
        element: <Home/>
    },
    {
        path: "/colaboradores",
        element: <Colaboradores/>
    },
    {
        path: "/brinquedos",
        element: <Brinquedos/>
    },
    {
        path: "/clientes",
        element: <Clientes/>
    }

]);

function App() {
    return <RouterProvider router={router} />;
}

export default App;
