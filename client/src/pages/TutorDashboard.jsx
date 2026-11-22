import API_URL from "../api.js";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/tutor-dashboard.css";

function TutorDashboard() {

    const navigate = useNavigate();

    const [tutor, setTutor] = useState(null);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);


    // =========================================
    // LOAD TUTOR
    // =========================================

    useEffect(() => {

        const savedTutor =
            JSON.parse(localStorage.getItem("tutor"));

        if (!savedTutor) {

            navigate("/tutor-login");

            return;

        }

        setTutor(savedTutor);

        fetchClasses(savedTutor);

    }, [navigate]);


    // =========================================
    // FETCH TUTOR'S CLASSES
    // =========================================

    const fetchClasses = async (tutorData) => {

        try {

            const tutorId =
                tutorData?._id || tutorData?.id;

            if (!tutorId) {

                console.log(
                    "Tutor ID not found:",
                    tutorData
                );

                setClasses([]);

                return;

            }

            const response = await fetch(
                `${API_URL}/api/classes/tutor/${tutorId}`
            );

            const data = await response.json();

            console.log(
                "Tutor classes response:",
                data
            );

            if (!response.ok) {

                console.log(
                    data.message ||
                    "Could not load tutor classes"
                );

                setClasses([]);

                return;

            }


            // =====================================
            // HANDLE API RESPONSE
            // =====================================

            if (Array.isArray(data)) {

                setClasses(data);

            } else if (Array.isArray(data.classes)) {

                setClasses(data.classes);

            } else if (Array.isArray(data.data)) {

                setClasses(data.data);

            } else {

                setClasses([]);

            }

        } catch (error) {

            console.log(
                "Error loading tutor classes:",
                error
            );

            setClasses([]);

        } finally {

            setLoading(false);

        }

    };


    // =========================================
    // DELETE CLASS
    // =========================================

    const deleteClass = async (classId) => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this class?\n\nThis will remove the class from TutorHub and learners will no longer see it."
        );

        if (!confirmDelete) {

            return;

        }


        try {

            const tutorId =
                tutor?._id || tutor?.id;


            const response = await fetch(

                `${API_URL}/api/classes/${classId}`,

                {

                    method: "DELETE",

                    headers: {

                        "Content-Type": "application/json"

                    },

                    body: JSON.stringify({

                        tutorId: tutorId

                    })

                }

            );


            const data =
                await response.json();


            if (!response.ok) {

                alert(
                    data.message ||
                    "Could not delete class"
                );

                return;

            }


            // =====================================
            // REMOVE CLASS FROM DASHBOARD
            // =====================================

            setClasses((previousClasses) =>

                previousClasses.filter(

                    (classroom) =>
                        classroom._id !== classId

                )

            );


            alert(
                "Class deleted successfully 🗑️"
            );


        } catch (error) {

            console.log(
                "Delete class error:",
                error
            );

            alert(
                "Something went wrong while deleting the class."
            );

        }

    };


    // =========================================
    // LOGOUT
    // =========================================

    const logout = () => {

        localStorage.removeItem("tutor");

        navigate("/tutor-login");

    };


    // =========================================
    // LOADING
    // =========================================

    if (loading) {

        return (

            <div
                style={{
                    padding: "30px"
                }}
            >

                <h2>
                    Loading TutorHub Dashboard...
                </h2>

            </div>

        );

    }


    // =========================================
    // DASHBOARD
    // =========================================

    return (
        <>
        <main className="th-tutor-dashboard">

            {/* =================================
                WELCOME
            ================================= */}

            <header className="th-tutor-welcome">
                <div><span className="th-tutor-eyebrow">TUTOR WORKSPACE</span><h1>Welcome {tutor?.name} 👋</h1><p>Manage your classes, learners and teaching activities.</p></div>
                <button className="th-tutor-primary" onClick={() => navigate("/create-class")}>+ Create Class</button>
            </header>


            <h2 className="th-tutor-section-title">TutorHub overview</h2>


            <hr
                style={{
                    margin: "30px 0"
                }}
            />


            {/* =================================
                MY CLASSES
            ================================= */}

            <div className="th-tutor-classes-heading">

                <div>

                    <h2>
                        My Classes
                    </h2>

                    <p>
                        Open a classroom to manage
                        announcements, materials,
                        assignments, lessons and learners.
                    </p>

                </div>


                {/* =================================
                    CREATE CLASS
                ================================= */}



            </div>


            {/* =================================
                CLASS LIST
            ================================= */}

            <div className="th-tutor-class-grid">

                {classes.length === 0 ? (

                    <div className="th-tutor-empty-state">

                        <h3>
                            📚 No classes yet
                        </h3>

                        <p>
                            Create your first class
                            to start managing your learners.
                        </p>

                        <button
                            onClick={() =>
                                navigate("/create-class")
                            }
                        >
                            + Create Your First Class
                        </button>

                    </div>

                ) : (

                    classes.map(
                        (classroom) => (

                            <div
                                key={
                                    classroom._id
                                }
                                className="th-tutor-class-card"
                                onClick={() =>
                                    navigate(
                                        `/tutor-classroom/${classroom._id}`
                                    )
                                }
                            >

                                <h3>
                                    📚{" "}
                                    {
                                        classroom.className
                                    }
                                </h3>


                                <p>

                                    <strong>
                                        Subject:
                                    </strong>{" "}

                                    {
                                        classroom.subject
                                    }

                                </p>


                                <p>

                                    👥{" "}

                                    {
                                        Array.isArray(
                                            classroom.learners
                                        )
                                            ? classroom.learners.length
                                            : 0
                                    }{" "}

                                    Learners

                                </p>


                                {/* =================================
                                    OPEN CLASSROOM
                                ================================= */}

                                <button
                                    onClick={(e) => {

                                        e.stopPropagation();

                                        navigate(
                                            `/tutor-classroom/${classroom._id}`
                                        );

                                    }}
                                >

                                    Open Classroom →

                                </button>


                                {/* =================================
                                    DELETE CLASS
                                ================================= */}

                                <button
                                    onClick={(e) => {

                                        e.stopPropagation();

                                        deleteClass(
                                            classroom._id
                                        );

                                    }}
                                    style={{
                                        marginLeft: "10px",
                                        padding: "8px 12px",
                                        border: "none",
                                        borderRadius: "6px",
                                        backgroundColor: "#dc2626",
                                        color: "#fff",
                                        cursor: "pointer",
                                        fontWeight: "600"
                                    }}
                                >

                                    🗑️ Delete Class

                                </button>

                            </div>

                        )
                    )

                )}

            </div>


            {/* =================================
                LOGOUT
            ================================= */}

            <button
                onClick={logout}
            >

                Logout

            </button>

        </main>
        </>
    );

}

export default TutorDashboard;


