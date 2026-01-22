import React, {useEffect} from 'react'
import { useNavigate } from "react-router-dom";

const Logout = () => {

    const navigate = useNavigate()

    useEffect(() => {    
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("username")
    navigate("/login")
    }, [navigate])


    return (
        <div></div>
    )
};


export default Logout;
