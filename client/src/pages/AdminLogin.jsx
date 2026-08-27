import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminLogin() {

    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);


    // =========================================
    // ADMIN LOGIN
    // =========================================

    const handleLogin = async (e) => {

        e.preventDefault();


        if (!username.trim() || !password) {

            alert(
                "Please enter your username and password."
            );

            return;

        }


        try {

            setLoading(true);


            const response =
                await fetch(
                    "http://localhost:5000/api/admin-auth/login",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            username:
                                username.trim(),

                            password

                        })

                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                alert(
                    data.message ||
                    "Invalid username or password."
                );

                return;

            }


            // =====================================
            // REMEMBER ADMIN LOGIN
            // =====================================

            localStorage.setItem(
                "adminLoggedIn",
                "true"
            );


            // =====================================
            // SAVE ADMIN JWT TOKEN
            // =====================================

            localStorage.setItem(
                "adminToken",
                data.token
            );


            // =====================================
            // STORE ADMIN USERNAME
            // =====================================

            localStorage.setItem(
                "adminUsername",
                data.admin?.username ||
                username.trim()
            );


            alert(
                "Login successful! 🚀"
            );


            navigate(
                "/admin"
            );


        } catch (error) {

            console.log(
                "Admin login error:",
                error
            );


            alert(
                "Could not connect to the server. Please make sure the backend is running."
            );

        } finally {

            setLoading(false);

        }

    };


    return (

        <div style={styles.page}>

            <div style={styles.card}>


                {/* HEADER */}

                <div style={styles.icon}>
                    🔐
                </div>


                <p style={styles.eyebrow}>
                    TUTORHUB ADMIN
                </p>


                <h1 style={styles.title}>
                    Admin Login
                </h1>


                <p style={styles.subtitle}>
                    Sign in to manage your TutorHub platform.
                </p>


                {/* FORM */}

                <form
                    onSubmit={handleLogin}
                    style={styles.form}
                >


                    {/* USERNAME */}

                    <div>

                        <label style={styles.label}>
                            Admin Username
                        </label>

                        <input

                            type="text"

                            placeholder="Enter admin username"

                            value={username}

                            onChange={(e) =>
                                setUsername(
                                    e.target.value
                                )
                            }

                            autoComplete="username"

                            style={styles.input}

                            disabled={loading}

                        />

                    </div>


                    {/* PASSWORD */}

                    <div>

                        <label style={styles.label}>
                            Admin Password
                        </label>

                        <input

                            type="password"

                            placeholder="Enter admin password"

                            value={password}

                            onChange={(e) =>
                                setPassword(
                                    e.target.value
                                )
                            }

                            autoComplete="current-password"

                            style={styles.input}

                            disabled={loading}

                        />

                    </div>


                    {/* LOGIN BUTTON */}

                    <button

                        type="submit"

                        style={
                            loading
                                ? styles.loginButtonDisabled
                                : styles.loginButton
                        }

                        disabled={loading}

                    >

                        {
                            loading
                                ? "Signing in..."
                                : "🔓 Login"
                        }

                    </button>


                </form>


                <p style={styles.footerText}>
                    TutorHub Platform Administration
                </p>


            </div>

        </div>

    );

}


// =====================================================
// STYLES
// =====================================================

const styles = {

    page: {

        minHeight: "100vh",

        background:
            "#f5f7fb",

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        padding: "20px",

        boxSizing: "border-box"

    },


    card: {

        width: "100%",

        maxWidth: "430px",

        background: "#ffffff",

        borderRadius: "20px",

        padding: "40px",

        boxSizing: "border-box",

        boxShadow:
            "0 12px 40px rgba(0,0,0,0.08)",

        border:
            "1px solid #e7eaf0"

    },


    icon: {

        width: "62px",

        height: "62px",

        borderRadius: "16px",

        background: "#eef2ff",

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        fontSize: "29px",

        marginBottom: "20px"

    },


    eyebrow: {

        margin: "0 0 7px",

        fontSize: "11px",

        fontWeight: "800",

        letterSpacing: "1.5px",

        opacity: 0.55

    },


    title: {

        margin: 0,

        fontSize: "29px",

        color: "#111827"

    },


    subtitle: {

        margin:
            "8px 0 28px",

        fontSize: "14px",

        lineHeight: 1.6,

        color: "#6b7280"

    },


    form: {

        display: "flex",

        flexDirection: "column",

        gap: "18px"

    },


    label: {

        display: "block",

        marginBottom: "7px",

        fontSize: "12px",

        fontWeight: "800",

        color: "#374151"

    },


    input: {

        width: "100%",

        boxSizing: "border-box",

        padding: "13px 14px",

        border:
            "1px solid #d9dee8",

        borderRadius: "10px",

        fontSize: "14px",

        outline: "none",

        background: "#ffffff"

    },


    loginButton: {

        width: "100%",

        border: "none",

        background: "#111827",

        color: "#ffffff",

        padding: "13px",

        borderRadius: "10px",

        cursor: "pointer",

        fontWeight: "800",

        fontSize: "14px",

        marginTop: "4px"

    },


    loginButtonDisabled: {

        width: "100%",

        border: "none",

        background: "#9ca3af",

        color: "#ffffff",

        padding: "13px",

        borderRadius: "10px",

        cursor: "not-allowed",

        fontWeight: "800",

        fontSize: "14px",

        marginTop: "4px"

    },


    footerText: {

        textAlign: "center",

        margin:
            "25px 0 0",

        fontSize: "11px",

        color: "#9ca3af"

    }

};


export default AdminLogin;