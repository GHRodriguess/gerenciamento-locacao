export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export async function refreshAccessToken(): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("Cannot refresh token on server");
  }

  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) {
    throw new Error("Sem refresh token");
  }

  const response = await fetch(`${API_BASE_URL}/token/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("username");
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  const data = await response.json();
  localStorage.setItem("access_token", data.access);
  return data.access;
}

export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;

  if (typeof window === "undefined") {
    return fetch(fullUrl, options);
  }

  const accessToken = localStorage.getItem("access_token");
  const headers = new Headers(options.headers || {});
  
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          headers.set("Authorization", `Bearer ${newToken}`);
          return fetch(fullUrl, { ...options, headers });
        })
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;

    try {
      const newAccessToken = await refreshAccessToken();
      processQueue(null, newAccessToken);
      headers.set("Authorization", `Bearer ${newAccessToken}`);
      return fetch(fullUrl, { ...options, headers });
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
      throw refreshErr;
    } finally {
      isRefreshing = false;
    }
  }

  return response;
}

export default authFetch;
