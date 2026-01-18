import { createBrowserRouter, RouterProvider, Link } from "react-router-dom";
import Login from "../src/auth/Login.jsx"
import Home from "../src/locacoes/Home.jsx"

const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/",
        element: <Home/>
    }
]);

function App() {
    return <RouterProvider router={router} />;
}

export default App;
