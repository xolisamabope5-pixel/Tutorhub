
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {

    const [platformSettings, setPlatformSettings] = useState({
        platformName: "TutorHub",
        primaryColor: "#111827",
        secondaryColor: "#eef2ff"
    });


    // =========================================
    // FETCH PLATFORM SETTINGS
    // =========================================

    useEffect(() => {

        const fetchPlatformSettings = async () => {

            try {

                const response = await fetch(
                    "https://tutorhub-api-bz1y.onrender.com/api/platform-settings"
                );

                if (!response.ok) {

                    throw new Error(
                        "Could not fetch platform settings"
                    );

                }

                const data = await response.json();

                setPlatformSettings({

                    platformName:
                        data.platformName ||
                        "TutorHub",

                    primaryColor:
                        data.primaryColor ||
                        "#111827",

                    secondaryColor:
                        data.secondaryColor ||
                        "#eef2ff"

                });

            } catch (error) {

                console.log(
                    "Could not load platform settings:",
                    error
                );

            }

        };


        fetchPlatformSettings();

    }, []);


    return (

        <nav
            className="navbar"
            style={{
                borderBottom:
                    `2px solid ${platformSettings.secondaryColor}`
            }}
        >

            {/* =====================================
                BRAND
            ===================================== */}

            <Link
                to="/"
                className="brand"
            >

                <div
                    className="brand-box"
                    style={{
                        borderColor:
                            platformSettings.secondaryColor
                    }}
                >

                    <span
                        className="brand-name"
                        style={{
                            color:
                                platformSettings.primaryColor
                        }}
                    >
                        {platformSettings.platformName}
                    </span>

                    <span className="brand-company">
                        by Solethu Labs
                    </span>

                </div>

            </Link>


            {/* =====================================
                NAVIGATION
            ===================================== */}

            <div className="nav-links">

                <Link to="/">
                    Home
                </Link>

                <Link to="/login">
                    Learner Login
                </Link>

                <Link to="/tutor-login">
                    Tutor Login
                </Link>

                <Link to="/register">
                    Learner Register
                </Link>

                <Link to="/tutor-register">
                    Tutor Register
                </Link>

                <Link to="/admin-login">
                    Admin
                </Link>

            </div>

        </nav>

    );

}

export default Navbar;


