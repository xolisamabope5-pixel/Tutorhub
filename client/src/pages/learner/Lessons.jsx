
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import BackButton from "../../components/BackButton";

function Lessons() {

    const navigate = useNavigate();

    const [lessons, setLessons] = useState([]);

    const [lessonView, setLessonView] =
        useState("live");

    const [loading, setLoading] =
        useState(true);


    // =========================================
    // LOAD LEARNER LESSONS
    // =========================================

    useEffect(() => {

        const savedLearner =
            localStorage.getItem("learner");


        if (!savedLearner) {

            navigate("/login");

            return;

        }


        const learnerData =
            JSON.parse(savedLearner);


        fetchLearnerLessons(
            learnerData
        );

    }, [navigate]);


    // =========================================
    // FETCH LESSONS
    // =========================================

    const fetchLearnerLessons =
        async (learnerData) => {

            try {

                setLoading(true);


                // =========================================
                // GET ALL CLASSES FOR LEARNER
                // =========================================

                const classResponse =
                    await fetch(

                        `https://tutorhub-api-bz1y.onrender.com/api/classes/program/${learnerData.programId._id}/${learnerData.grade}`

                    );


                const classData =
                    await classResponse.json();


                if (!classResponse.ok) {

                    throw new Error(
                        "Could not load classes"
                    );

                }


                // =========================================
                // ONLY JOINED CLASSES
                // =========================================

                const joinedClasses =
                    classData.filter(
                        (item) =>

                            item.learners?.some(

                                (learner) =>

                                    learner._id?.toString() ===
                                    learnerData._id.toString()

                            )

                    );


                // =========================================
                // FETCH LESSONS FROM EACH CLASS
                // =========================================

                const lessonRequests =
                    joinedClasses.map(
                        (item) =>

                            fetch(

                                `https://tutorhub-api-bz1y.onrender.com/api/lessons/class/${item._id}`

                            ).then(
                                (response) =>
                                    response.json()
                            )

                    );


                const lessonResults =
                    await Promise.all(
                        lessonRequests
                    );


                // =========================================
                // COMBINE ALL LESSONS
                // =========================================

                const allLessons =
                    lessonResults.flat();


                setLessons(
                    allLessons
                );


            } catch (error) {

                console.log(
                    "Error loading learner lessons:",
                    error
                );


                setLessons([]);

            } finally {

                setLoading(false);

            }

        };


    // =========================================
    // LESSON STATUS
    // SAME LOGIC AS CLASSROOM
    // =========================================

    const getLessonStatus =
        (lesson) => {

            if (
                !lesson.date ||
                !lesson.time
            ) {

                return "upcoming";

            }


            try {

                const startTime =
                    new Date(
                        `${lesson.date}T${lesson.time}`
                    );


                let endTime;


                if (lesson.endsAt) {

                    endTime =
                        new Date(
                            `${lesson.date}T${lesson.endsAt}`
                        );

                } else {

                    endTime =
                        new Date(
                            startTime.getTime() +
                            Number(
                                lesson.duration || 60
                            ) *
                            60 *
                            1000
                        );

                }


                const now =
                    new Date();


                if (now < startTime) {

                    return "upcoming";

                }


                if (
                    now >= startTime &&
                    now < endTime
                ) {

                    return "live";

                }


                return "completed";


            } catch (error) {

                console.log(
                    "Error calculating lesson status:",
                    error
                );


                return "upcoming";

            }

        };


    // =========================================
    // FILTER LESSONS
    // =========================================

    const liveLessons =
        lessons.filter(
            (lesson) =>
                getLessonStatus(lesson) ===
                "live"
        );


    const upcomingLessons =
        lessons
            .filter(
                (lesson) =>
                    getLessonStatus(lesson) ===
                    "upcoming"
            )
            .sort(
                (a, b) =>

                    new Date(
                        `${a.date}T${a.time}`
                    ) -

                    new Date(
                        `${b.date}T${b.time}`
                    )

            );


    const completedLessons =
        lessons
            .filter(
                (lesson) =>
                    getLessonStatus(lesson) ===
                    "completed"
            )
            .sort(
                (a, b) =>

                    new Date(
                        `${b.date}T${b.time}`
                    ) -

                    new Date(
                        `${a.date}T${a.time}`
                    )

            );


    // =========================================
    // JOIN LIVE LESSON
    // =========================================

    const joinLesson =
        (room) => {

            if (!room) {

                alert(
                    "Live lesson link is not available."
                );

                return;

            }


            window.open(

                `https://meet.jit.si/${room}`,

                "_blank"

            );

        };


    // =========================================
    // WATCH RECORDING
    // =========================================

    const watchRecording =
        (link) => {

            if (!link) {

                alert(
                    "Recording is not available yet."
                );

                return;

            }


            window.open(
                link,
                "_blank"
            );

        };


    // =========================================
    // LESSON CARD
    // SAME STRUCTURE AS CLASSROOM
    // =========================================

    const LessonCard =
        ({
            lesson,
            type
        }) => {

            return (

                <div
                    style={{
                        border:
                            "1px solid #ddd",

                        padding:
                            "20px",

                        marginBottom:
                            "18px",

                        borderRadius:
                            "12px",

                        backgroundColor:
                            "#fff"
                    }}
                >

                    <h3>
                        🎥 {lesson.title}
                    </h3>


                    {lesson.description && (

                        <p>
                            {lesson.description}
                        </p>

                    )}


                    <p>

                        📅 <strong>Date:</strong>{" "}

                        {lesson.date}

                    </p>


                    <p>

                        ⏰ <strong>Start Time:</strong>{" "}

                        {lesson.time}

                    </p>


                    {lesson.duration && (

                        <p>

                            ⏱️ <strong>Duration:</strong>{" "}

                            {lesson.duration} minutes

                        </p>

                    )}


                    {lesson.endsAt && (

                        <p>

                            🏁 <strong>Ends at:</strong>{" "}

                            {lesson.endsAt}

                        </p>

                    )}


                    {lesson.tutorId && (

                        <p>

                            👨‍🏫 <strong>Tutor:</strong>{" "}

                            {lesson.tutorId.name}{" "}

                            {lesson.tutorId.surname}

                        </p>

                    )}


                    {type === "live" && (

                        <div>

                            <p>
                                🟢{" "}
                                <strong>
                                    Live Now
                                </strong>
                            </p>


                            <button
                                onClick={() =>
                                    joinLesson(
                                        lesson.jitsiRoom
                                    )
                                }
                            >

                                🔴 Join Live Lesson

                            </button>

                        </div>

                    )}


                    {type === "upcoming" && (

                        <div>

                            <p>

                                🟡{" "}

                                <strong>
                                    Upcoming Lesson
                                </strong>

                            </p>

                        </div>

                    )}


                    {type === "completed" && (

                        <div>

                            <p>

                                ⚫{" "}

                                <strong>
                                    Lesson Completed
                                </strong>

                            </p>


                            {lesson.recordingLink ? (

                                <button
                                    onClick={() =>
                                        watchRecording(
                                            lesson.recordingLink
                                        )
                                    }
                                >

                                    ▶️ Watch Recording

                                </button>

                            ) : (

                                <p>

                                    🎬 Recording Coming Soon

                                </p>

                            )}

                        </div>

                    )}

                </div>

            );

        };


    // =========================================
    // LOADING
    // =========================================

    if (loading) {

        return (

            <div>

                <h2>
                    🎥 Lessons
                </h2>

                <p>
                    Loading lessons...
                </p>

            </div>

        );

    }


    // =========================================
    // MAIN
    // =========================================

    return (

        <div>

            <h1>
                🎥 My Lessons
            </h1>


            <p>
                View your live lessons,
                upcoming classes and
                lesson recordings.
            </p>


            {/* ========================================= */}
            {/* LESSON NAVIGATION */}
            {/* ========================================= */}

            <div
                style={{
                    display:
                        "flex",

                    gap:
                        "10px",

                    marginBottom:
                        "25px",

                    flexWrap:
                        "wrap"
                }}
            >

                <button
                    onClick={() =>
                        setLessonView("live")
                    }

                    style={{
                        fontWeight:
                            lessonView === "live"
                                ? "bold"
                                : "normal"
                    }}
                >

                    🟢 Live

                </button>


                <button
                    onClick={() =>
                        setLessonView("upcoming")
                    }

                    style={{
                        fontWeight:
                            lessonView === "upcoming"
                                ? "bold"
                                : "normal"
                    }}
                >

                    🟡 Upcoming

                </button>


                <button
                    onClick={() =>
                        setLessonView("completed")
                    }

                    style={{
                        fontWeight:
                            lessonView === "completed"
                                ? "bold"
                                : "normal"
                    }}
                >

                    🎬 Recordings

                </button>

            </div>


            {/* ========================================= */}
            {/* LIVE */}
            {/* ========================================= */}

            {lessonView === "live" && (

                <div>

                    <h2>
                        🟢 Live Now
                    </h2>


                    {liveLessons.length === 0 ? (

                        <p>
                            No lessons are live
                            right now.
                        </p>

                    ) : (

                        liveLessons.map(
                            (lesson) => (

                                <LessonCard
                                    key={
                                        lesson._id
                                    }

                                    lesson={
                                        lesson
                                    }

                                    type="live"
                                />

                            )
                        )

                    )}

                </div>

            )}


            {/* ========================================= */}
            {/* UPCOMING */}
            {/* ========================================= */}

            {lessonView === "upcoming" && (

                <div>

                    <h2>
                        🟡 Upcoming Lessons
                    </h2>


                    {upcomingLessons.length === 0 ? (

                        <p>
                            No upcoming lessons.
                        </p>

                    ) : (

                        upcomingLessons.map(
                            (lesson) => (

                                <LessonCard
                                    key={
                                        lesson._id
                                    }

                                    lesson={
                                        lesson
                                    }

                                    type="upcoming"
                                />

                            )
                        )

                    )}

                </div>

            )}


            {/* ========================================= */}
            {/* RECORDINGS */}
            {/* ========================================= */}

            {lessonView === "completed" && (

                <div>

                    <h2>
                        🎬 Recordings
                    </h2>


                    {completedLessons.length === 0 ? (

                        <p>
                            No completed lessons yet.
                        </p>

                    ) : (

                        completedLessons.map(
                            (lesson) => (

                                <LessonCard
                                    key={
                                        lesson._id
                                    }

                                    lesson={
                                        lesson
                                    }

                                    type="completed"
                                />

                            )
                        )

                    )}

                </div>

            )}


            <br />
            <br />

            <BackButton />

        </div>

    );

}

export default Lessons;


