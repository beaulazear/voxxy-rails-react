import React, { useState, useEffect } from "react";

const UserContext = React.createContext();

function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

    useEffect(() => {
        fetch(`${API_URL}/me`, {
            credentials: 'include'
        })
            .then((response) => {
                if (response.ok) {
                    response.json().then(setUser);
                }
            })
            .finally(() => setLoading(false));
    }, [API_URL]);

    return (
        <UserContext.Provider value={{ user, setUser, loading }}>
            {children}
        </UserContext.Provider>
    );
}

export { UserContext, UserProvider };