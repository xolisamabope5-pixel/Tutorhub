
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import ClassCard from "../../components/ClassCard";
import BackButton from "../../components/BackButton";

function MyClasses() {

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


            if (!programId || !grade) {

                console.log(
                    "Learner program or grade is missing."
                );

                return;

            }


            fetchClasses(
                programId,
                grade,
                learnerData._id
            );


        } catch (error) {

            console.log(
                "Could not read learner data:",
                error
            );

        }

    }, [navigate]);


    // =========================================
    // FETCH GRADE CLASSES
    // =========================================

    const fetchClasses = async (
        programId,
        grade,
        learnerId
    ) => {

        try {

            const response = await fetch(

                `https://tutorhub-api-bz1y.onrender.com/api/classes/program/${programId}/${encodeURIComponent(grade)}`

            );


            const data =
                await response.json();


            if (!response.ok) {

                console.log(
                    data.message ||
                    "Could not load classes"
                );

                setClasses([]);

                return;

            }


            const allClasses =
                Array.isArray(data)
                    ? data
                    : [];


            // =====================================
            // ONLY CLASSES LEARNER HAS JOINED
            // =====================================

            const joinedClasses =
                allClasses.filter(
                    (classroom) =>

                        Array.isArray(
                            classroom.learners
                        )

                        &&

                        classroom.learners.some(
                            (joinedLearner) =>

                                String(
                                    joinedLearner._id
                                ) ===
                                String(learnerId)

                        )
                );


            console.log(
                "All grade classes:",
                allClasses
            );


            console.log(
                "My joined classes:",
                joinedClasses
            );


            setClasses(
                joinedClasses
            );


        } catch (error) {

            console.log(
                "Error loading my classes:",
                error
            );

            setClasses([]);

        }

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
                My Classes 📚
            </h1>


            <p>
                These are the classes you have joined.
            </p>


            {

                classes.length === 0

                    ?

                    (

                        <p>
                            You have not joined any
                            classes yet.
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

                                    buttonText="🚀 Enter Classroom"

                                    onClick={() =>

                                        navigate(
                                            `/classroom/${item._id}`
                                        )

                                    }

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


export default MyClasses;


