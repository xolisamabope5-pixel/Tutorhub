import API_URL from "../../api.js";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import ClassCard from "../../components/ClassCard";
import BackButton from "../../components/BackButton";

function BrowseClasses() {

    const navigate = useNavigate();

    const [learner, setLearner] = useState(null);

    const [classes, setClasses] = useState([]);
    const learnerHeaders = () => { let token = ""; try { token = JSON.parse(localStorage.getItem("learner") || "null")?.token || ""; } catch {} return token ? { Authorization: `Bearer ${token}` } : {}; };


    // =========================================
    // LOAD LEARNER
    // =========================================

    useEffect(() => {

        const savedLearner =
            localStorage.getItem("learner");


        if (!savedLearner) {

            navigate("/login");

            return;

        }


        try {

            const learnerData =
                JSON.parse(savedLearner);


            setLearner(learnerData);


            fetchClasses(learnerData._id || learnerData.id);

        } catch (error) {

            console.log(
                "Could not read learner data:",
                error
            );

        }

    }, [navigate]);


    // =========================================
    // FETCH ALL CLASSES FOR LEARNER GRADE
    // =========================================

    const fetchClasses = async (learnerId) => {

        try {

            const response = await fetch(

                `${API_URL}/api/classes/browse/learner/${learnerId}`,
                { headers: learnerHeaders() }
            );


            const data =
                await response.json();


            console.log(
                "Browse classes response:",
                data
            );


            if (!response.ok) {

                console.log(
                    data.message ||
                    "Could not load classes"
                );

                setClasses([]);

                return;

            }


            setClasses(
                Array.isArray(data)
                    ? data
                    : []
            );


        } catch (error) {

            console.log(
                "Error loading classes:",
                error
            );

            setClasses([]);

        }

    };


    // =========================================
    // JOIN CLASS
    // =========================================

    const joinClass = async (
        classId
    ) => {

        try {

            const response = await fetch(

                `${API_URL}/api/classes/${classId}/join`,

                {

                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json",
                        ...learnerHeaders()
                    },

                    body: JSON.stringify({

                        learnerId:
                            learner._id || learner.id

                    })

                }

            );


            const data =
                await response.json();


            if (response.ok) {

                alert("Joined class successfully 🚀 Your class is now in My Classes.");
                navigate("/learner/classes");


            } else {

                alert(
                    data.message ||
                    "Could not join class"
                );

            }


        } catch (error) {

            console.log(
                "Join class error:",
                error
            );

            alert(
                "Could not join class"
            );

        }

    };


    // =========================================
    // CHECK IF LEARNER JOINED
    // =========================================

    const hasJoined = (
        classItem
    ) => {

        return classItem.learners?.some(

            item =>

                String(item?._id || item) ===
                String(learner?._id || learner?.id)

        );

    };


    // =========================================
    // LOADING
    // =========================================

    if (!learner) {

        return (

            <h2>
                Loading...
            </h2>

        );

    }


    // =========================================
    // PAGE
    // =========================================

    return (

        <div>

            <h1>
                Browse Classes 🔎
            </h1>


            <p>
                Find all classes available
                for your grade.
            </p>


            {

                classes.length === 0

                    ?

                    (

                        <p>
                            No classes are available
                            for your grade yet.
                        </p>

                    )

                    :

                    (

                        classes.map(
                            (item) => (

                                <ClassCard

                                    key={
                                        item._id
                                    }

                                    classroom={
                                        item
                                    }

                                    buttonText={

                                        hasJoined(item)

                                            ?

                                            "🚀 Enter Classroom"

                                            :

                                            "Join Class"

                                    }


                                    onClick={() => {

                                        if (
                                            hasJoined(item)
                                        ) {

                                            navigate(
                                                `/classroom/${item._id}`
                                            );

                                        } else {

                                            joinClass(
                                                item._id
                                            );

                                        }

                                    }}

                                />

                            )
                        )

                    )

            }


            <br />


            <BackButton />

        </div>

    );

}


export default BrowseClasses;

