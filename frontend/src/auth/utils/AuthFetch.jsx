async function refreshAccessToken() {
    const refresh = localStorage.getItem("refresh_token");

    if (!refresh) {
        throw new Error("Sem refresh token");
    }

    const response = await fetch(
        import.meta.env.VITE_API_URL + "/token/refresh",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ refresh }),
        }
    );

    if (!response.ok) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        throw new Error("Refresh expirado");
    }

    const data = await response.json();

    localStorage.setItem("access_token", data.access);

    return data.access;
}

async function authFetch(url, options = {}) {
    const accessToken = localStorage.getItem("access_token");    
    const originalOptions = {
        ...options,
        headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${accessToken}`,
        },
    };

    const response = await fetch(url, originalOptions);
    if (response.status !== 401) {        
        return response;
    }
    

    try {
        const newAccessToken = await refreshAccessToken();
        return fetch(url, {
            ...options,
            headers: {
                ...(options.headers || {}),
                Authorization: `Bearer ${newAccessToken}`,
            },
        });
    } catch (error) {
        console.error("Sessão expirada");
        window.location.href = "/login";
        
        throw error;
    }
}

export default authFetch