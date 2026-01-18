export const fetchWrapper = async (url: string, options?: RequestInit) => {
    const res = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } });
    if (!res.ok) throw new Error("API error");
    return res.json();
};

export const apiFetch = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("authToken"); // jeśli jest auth
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const res = await fetch(url, { ...options, headers });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`API Error: ${res.status} ${text}`);
    }

    return res.json();
};
