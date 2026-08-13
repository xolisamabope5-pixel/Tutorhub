
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import ClassCard from "../../components/ClassCard";
import BackButton from "../../components/BackButton";

function BrowseClasses() {

    const navigate = useNavigate();

    const [learner, setLearner] = useState(null);

    const [classes, setClasses] = useState([]);


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


            const programId =
                learnerData.programId?._id ||
                learnerData.programId;


            const grade =
                String(
                    learnerData.grade
                ).trim();


            console.log(
                "Learner program:",
                programId
            );

            console.log(
                "Learner grade:",
                grade
            );


            if (!programId || !grade) {

                console.log(
                    "Learner program or grade is missing."
                );

                return;

            }


            fetchClasses(
                programId,
                grade
            );


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

    const fetchClasses = async (
        programId,
        grade
    ) => {

        try {

            const response = await fetch(

                `http://localhost:5000/api/classes/program/${programId}/${encodeURIComponent(grade)}`

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

                `http://localhost:5000/api/classes/${classId}/join`,

                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        learnerId:
                            learner._id

                    })

                }

            );


            const data =
                await response.json();


            if (response.ok) {

                alert(
                    "Joined class successfully 🚀"
                );


                const programId =
                    learner.programId?._id ||
                    learner.programId;


                const grade =
                    String(
                        learner.grade
                    ).trim();


                fetchClasses(
                    programId,
                    grade
                );


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

                String(item._id) ===
                String(learner._id)

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
