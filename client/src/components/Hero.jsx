
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Hero.css";

function Hero() {

    const [platformSettings, setPlatformSettings] = useState({
        platformName: "TutorHub",
        tagline: "Smart Tuition Management Platform",
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

                    tagline:
                        data.tagline ||
                        "Smart Tuition Management Platform",

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

        <section
            className="hero"
            style={{
                background:
                    platformSettings.secondaryColor
            }}
        >

            <div className="hero-content">


                <h1
                    style={{
                        color:
                            platformSettings.primaryColor
                    }}
                >
                    {platformSettings.platformName}
                </h1>


                <h2>
                    {platformSettings.tagline}
                </h2>


                <p>
                    Manage learners, track payments,
                    organize classes, and bring your
                    tuition centre online.
                </p>


                <div className="hero-buttons">


                    <Link to="/register">

                        <button
                            style={{
                                background:
                                    platformSettings.primaryColor
                            }}
                        >
                            Join {platformSettings.platformName}
                        </button>

                    </Link>


                    <Link to="/admin-login">

                        <button
                            className="secondary-btn"
                            style={{
                                color:
                                    platformSettings.primaryColor,
                                borderColor:
                                    platformSettings.primaryColor
                            }}
                        >
                            Admin Login
                        </button>

                    </Link>


                </div>


            </div>


        </section>

    );

}

export default Hero;


