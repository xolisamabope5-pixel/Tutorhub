
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import BackButton from "../components/BackButton";

function Classroom() {

    const { id } = useParams();

    // ==============================
    // CLASSROOM
    // ==============================

    const [classroom, setClassroom] = useState(null);

    // ==============================
    // TABS
    // ==============================

    const [activeTab, setActiveTab] = useState("stream");

    // ==============================
    // LESSON VIEW
    // ==============================

    const [lessonView, setLessonView] = useState("live");

    // ==============================
    // ASSIGNMENTS
    // ==============================

    const [assignments, setAssignments] = useState([]);

    const [selectedAssignment, setSelectedAssignment] = useState(null);

    const [assignmentAnswers, setAssignmentAnswers] = useState([]);

    const [submission, setSubmission] = useState(null);

    const [assignmentLoading, setAssignmentLoading] = useState(false);

    const [submittingAssignment, setSubmittingAssignment] =
        useState(false);

    // ==============================
    // LESSONS
    // ==============================

    const [lessons, setLessons] = useState([]);

    // ==============================
    // CURRENT TIME
    // ==============================

    const [, setCurrentTime] = useState(new Date());

    // ==============================
    // LOADING
    // ==============================

    const [loading, setLoading] = useState(true);

    // ==============================
    // LOAD CLASSROOM
    // ==============================

    useEffect(() => {

        loadClassroom();

    }, [id]);

    // ==============================
    // LIVE CLOCK
    // ==============================

    useEffect(() => {

        const timer = setInterval(() => {

            setCurrentTime(new Date());

        }, 1000);

        return () => {

            clearInterval(timer);

        };

    }, []);

    // ==============================
    // FETCH CLASSROOM
    // ==============================

    const loadClassroom = async () => {

        try {

            setLoading(true);

            const classResponse = await fetch(
                `https://tutorhub-api-bz1y.onrender.com/api/classes/${id}`
            );

            const classData = await classResponse.json();

            if (!classResponse.ok) {

                console.log(
                    classData.message ||
                    "Failed to load classroom"
                );

                return;

            }

            setClassroom(classData);

            await loadAssignments();

            await loadLessons();

        } catch (error) {

            console.log(
                "Error loading classroom:",
                error
            );

        } finally {

            setLoading(false);

        }

    };

    // ==============================
    // FETCH ASSIGNMENTS
    // ==============================

    const loadAssignments = async () => {

        try {

            const response = await fetch(
                `https://tutorhub-api-bz1y.onrender.com/api/assignments/class/${id}`
            );

            const data = await response.json();

            if (response.ok) {

                setAssignments(
                    Array.isArray(data) ? data : []
                );

            } else {

                console.log(
                    data.message ||
                    "Failed to load assignments"
                );

            }

        } catch (error) {

            console.log(
                "Error loading assignments:",
                error
            );

        }

    };

    // ==============================
    // FETCH LESSONS
    // ==============================

    const loadLessons = async () => {

        try {

            const response = await fetch(
                `https://tutorhub-api-bz1y.onrender.com/api/lessons/class/${id}`
            );

            const data = await response.json();

            if (response.ok) {

                setLessons(
                    Array.isArray(data) ? data : []
                );

            } else {

                console.log(
                    data.message ||
                    "Failed to load lessons"
                );

            }

        } catch (error) {

            console.log(
                "Error loading lessons:",
                error
            );

        }

    };

    // ==============================
    // GET LOGGED IN LEARNER
    // ==============================

    const getLoggedInLearner = () => {

        try {

            const savedLearner =
                localStorage.getItem("learner");

            if (!savedLearner) {

                return null;

            }

            return JSON.parse(savedLearner);

        } catch (error) {

            console.log(
                "Error reading learner:",
                error
            );

            return null;

        }

    };

    // ==============================
    // LESSON STATUS
    // ==============================

    const getLessonStatus = (lesson) => {

        if (!lesson.date || !lesson.time) {

            return "upcoming";

        }

        try {

            const startTime = new Date(
                `${lesson.date}T${lesson.time}`
            );

            let endTime;

            if (lesson.endsAt) {

                endTime = new Date(
                    `${lesson.date}T${lesson.endsAt}`
                );

            } else {

                endTime = new Date(
                    startTime.getTime() +
                    Number(lesson.duration || 60) *
                    60 *
                    1000
                );

            }

            const now = new Date();

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

    // ==============================
    // LESSONS BY STATUS
    // ==============================

    const liveLessons = lessons.filter(
        (lesson) =>
            getLessonStatus(lesson) === "live"
    );

    const upcomingLessons = lessons
        .filter(
            (lesson) =>
                getLessonStatus(lesson) === "upcoming"
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

    const completedLessons = lessons
        .filter(
            (lesson) =>
                getLessonStatus(lesson) === "completed"
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

    // ==============================
    // JOIN JITSI
    // ==============================

    const joinLesson = (room) => {

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

    // ==============================
    // WATCH RECORDING
    // ==============================

    const watchRecording = (link) => {

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

    // ==============================
    // OPEN ASSIGNMENT
    // ==============================

    const openAssignment = async (assignmentId) => {

        try {

            setAssignmentLoading(true);

            setSelectedAssignment(null);

            setSubmission(null);

            setAssignmentAnswers([]);

            // ==============================
            // GET ASSIGNMENT
            // ==============================

            const response = await fetch(
                `https://tutorhub-api-bz1y.onrender.com/api/assignments/${assignmentId}`
            );

            const data = await response.json();

            if (!response.ok) {

                alert(
                    data.message ||
                    "Could not open assignment"
                );

                return;

            }

            setSelectedAssignment(data);

            // ==============================
            // GET LEARNER
            // ==============================

            const learner =
                getLoggedInLearner();

            const learnerId =
                learner?._id ||
                learner?.id;

            // ==============================
            // CREATE DEFAULT ANSWERS
            // ==============================

            const defaultAnswers =
                (data.questions || []).map(
                    (question) => ({

                        questionId:
                            question._id,

                        answer: ""

                    })
                );

            // ==============================
            // GET EXISTING SUBMISSION
            // ==============================

            if (learnerId) {

                try {

                    const submissionResponse =
                        await fetch(
                            `https://tutorhub-api-bz1y.onrender.com/api/submissions/learner/${learnerId}/${assignmentId}`
                        );

                    if (submissionResponse.ok) {

                        const submissionData =
                            await submissionResponse.json();

                        console.log(
                            "Existing submission:",
                            submissionData
                        );

                        setSubmission(
                            submissionData
                        );

                        // ==============================
                        // IMPORTANT FIX
                        // LOAD SAVED ANSWERS
                        // ==============================

                        const savedAnswers =
                            Array.isArray(
                                submissionData.answers
                            )
                                ? submissionData.answers
                                : [];

                        const mergedAnswers =
                            defaultAnswers.map(
                                (questionAnswer) => {

                                    const savedAnswer =
                                        savedAnswers.find(
                                            (saved) =>
                                                String(
                                                    saved.questionId
                                                ) ===
                                                String(
                                                    questionAnswer.questionId
                                                )
                                        );

                                    return {

                                        questionId:
                                            questionAnswer.questionId,

                                        answer:
                                            savedAnswer?.answer ||
                                            ""

                                    };

                                }
                            );

                        setAssignmentAnswers(
                            mergedAnswers
                        );

                    } else {

                        // No submission yet
                        setSubmission(null);

                        setAssignmentAnswers(
                            defaultAnswers
                        );

                    }

                } catch (error) {

                    console.log(
                        "No existing submission found:",
                        error
                    );

                    setSubmission(null);

                    setAssignmentAnswers(
                        defaultAnswers
                    );

                }

            } else {

                setAssignmentAnswers(
                    defaultAnswers
                );

            }

        } catch (error) {

            console.log(
                "Error opening assignment:",
                error
            );

            alert(
                "Could not open assignment"
            );

        } finally {

            setAssignmentLoading(false);

        }

    };

    // ==============================
    // CLOSE ASSIGNMENT
    // ==============================

    const closeAssignment = () => {

        setSelectedAssignment(null);

        setAssignmentAnswers([]);

        setSubmission(null);

    };

    // ==============================
    // CHECK DUE DATE
    // ==============================

    const isAssignmentClosed = (assignment) => {

        if (!assignment?.dueDate) {

            return false;

        }

        const dueDate =
            new Date(
                assignment.dueDate
            );

        dueDate.setHours(
            23,
            59,
            59,
            999
        );

        return new Date() > dueDate;

    };

    // ==============================
    // UPDATE ANSWER
    // ==============================

    const updateAnswer = (
        questionId,
        answer
    ) => {

        setAssignmentAnswers(
            (previous) =>
                previous.map(
                    (item) =>
                        String(
                            item.questionId
                        ) ===
                        String(
                            questionId
                        )
                            ? {
                                ...item,
                                answer
                            }
                            : item
                )
        );

    };

   
// ==============================
// SUBMIT ASSIGNMENT
// ==============================

const submitAssignment = async () => {

    if (!selectedAssignment) {
        return;
    }

    // ==============================
    // CHECK DUE DATE
    // ==============================

    if (isAssignmentClosed(selectedAssignment)) {

        alert(
            "This assignment is no longer accepting submissions."
        );

        return;
    }

    // ==============================
    // GET LEARNER
    // ==============================

    const learner = getLoggedInLearner();

    const learnerId =
        learner?._id ||
        learner?.id;

    if (!learnerId) {

        alert(
            "Learner information could not be found."
        );

        return;
    }

    // ==============================
    // BUILD FINAL ANSWERS
    // ==============================
    //
    // IMPORTANT:
    // Build the answers directly from the
    // assignment questions so every question
    // gets included.
    //
    // ==============================

    const finalAnswers =
        selectedAssignment.questions.map(
            (question) => {

                const existingAnswer =
                    assignmentAnswers.find(
                        (item) =>
                            String(item.questionId) ===
                            String(question._id)
                    );

                return {

                    questionId:
                        question._id,

                    answer:
                        existingAnswer?.answer || ""

                };

            }
        );


    // ==============================
    // CHECK UNANSWERED QUESTIONS
    // ==============================

    const unanswered =
        finalAnswers.some(
            (item) =>
                !item.answer ||
                item.answer.trim() === ""
        );


    if (unanswered) {

        const confirmSubmit =
            window.confirm(
                "Some questions are unanswered. Do you still want to submit?"
            );

        if (!confirmSubmit) {

            return;

        }

    }


    // ==============================
    // DEBUG
    // ==============================
    //
    // Keep this temporarily.
    // It lets us see exactly what is
    // being sent to MongoDB.
    //
    // ==============================

    console.log(
        "SUBMISSION BEING SENT:",
        {
            learnerId,
            assignmentId:
                selectedAssignment._id,
            answers:
                finalAnswers
        }
    );


    // ==============================
    // SUBMIT
    // ==============================

    try {

        setSubmittingAssignment(true);


        const response =
            await fetch(
                "https://tutorhub-api-bz1y.onrender.com/api/submissions/create",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        learnerId,

                        assignmentId:
                            selectedAssignment._id,

                        answers:
                            finalAnswers

                    })

                }
            );


        const data =
            await response.json();


        // ==============================
        // ERROR
        // ==============================

        if (!response.ok) {

            alert(
                data.message ||
                "Failed to submit assignment"
            );

            return;

        }


        // ==============================
        // SUCCESS
        // ==============================

        alert(
            "Assignment submitted successfully 🚀"
        );


        // Make sure the local state contains
        // the actual answers that were submitted.

        setSubmission({

            ...data,

            answers:
                data.answers ||
                finalAnswers

        });


        // Also keep the answers in state.

        setAssignmentAnswers(
            finalAnswers
        );


    } catch (error) {

        console.log(
            "Submission error:",
            error
        );

        alert(
            "Could not submit assignment"
        );

    } finally {

        setSubmittingAssignment(false);

    }

};


    // ==============================
    // LESSON CARD
    // ==============================

    const LessonCard = ({
        lesson,
        type
    }) => {

        return (

            <div
                style={{
                    border: "1px solid #ddd",
                    padding: "20px",
                    marginBottom: "18px",
                    borderRadius: "12px",
                    backgroundColor: "#fff"
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
                            🟢 <strong>Live Now</strong>
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
                            🟡 <strong>Upcoming Lesson</strong>
                        </p>

                    </div>

                )}

                {type === "completed" && (

                    <div>

                        <p>
                            ⚫ <strong>Lesson Completed</strong>
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

    // ==============================
    // ASSIGNMENT CARD
    // ==============================

    const AssignmentCard = ({
        assignment
    }) => {

        const closed =
            isAssignmentClosed(
                assignment
            );

        return (

            <div
                style={{
                    border: "1px solid #ddd",
                    padding: "20px",
                    marginBottom: "18px",
                    borderRadius: "12px",
                    backgroundColor: "#fff"
                }}
            >

                <h3>
                    📝 {assignment.title}
                </h3>

                {assignment.description && (

                    <p>
                        {assignment.description}
                    </p>

                )}

                <p>

                    📅 <strong>Due Date:</strong>{" "}

                    {assignment.dueDate
                        ? new Date(
                            assignment.dueDate
                        ).toLocaleDateString()
                        : "Not specified"
                    }

                </p>

                <p>

                    🏆 <strong>Total Marks:</strong>{" "}

                    {assignment.totalMarks}

                </p>

                <p>

                    {closed
                        ? "⚫ Assignment Completed"
                        : "🟢 Assignment Open"
                    }

                </p>

                <button
                    onClick={() =>
                        openAssignment(
                            assignment._id
                        )
                    }
                >

                    {closed
                        ? "👁️ View Assignment"
                        : "✍️ Open Assignment"
                    }

                </button>

            </div>

        );

    };

    // ==============================
    // LOADING
    // ==============================

    if (loading) {

        return (

            <div>

                <h2>
                    📚 Loading classroom...
                </h2>

            </div>

        );

    }

    // ==============================
    // CLASSROOM NOT FOUND
    // ==============================

    if (!classroom) {

        return (

            <div>

                <h2>
                    Classroom not found.
                </h2>

                <BackButton />

            </div>

        );

    }

    // ==============================
    // MAIN
    // ==============================

    return (

        <div>

            {/* ================================= */}
            {/* CLASSROOM HEADER */}
            {/* ================================= */}

            <div>

                <h1>
                    📚 {classroom.className}
                </h1>

                <h2>
                    {classroom.subject}
                </h2>

                {classroom.description && (

                    <p>
                        {classroom.description}
                    </p>

                )}

                {classroom.tutorId && (

                    <p>

                        👨‍🏫 Tutor:{" "}

                        {classroom.tutorId.name}{" "}

                        {classroom.tutorId.surname}

                    </p>

                )}

            </div>

            <hr />

            {/* ================================= */}
            {/* CLASSROOM NAVIGATION */}
            {/* ================================= */}

            <div>

                <button
                    onClick={() =>
                        setActiveTab("stream")
                    }
                >
                    📢 Stream
                </button>

                <button
                    onClick={() =>
                        setActiveTab("materials")
                    }
                >
                    📚 Materials
                </button>

                <button
                    onClick={() =>
                        setActiveTab("assignments")
                    }
                >
                    📝 Assignments
                </button>

                <button
                    onClick={() =>
                        setActiveTab("lessons")
                    }
                >
                    🎥 Lessons
                </button>

                <button
                    onClick={() =>
                        setActiveTab("people")
                    }
                >
                    👥 People
                </button>

            </div>

            <hr />

            {/* ================================= */}
            {/* STREAM */}
            {/* ================================= */}

            {activeTab === "stream" && (

                <div>

                    <h2>
                        📢 Announcements
                    </h2>

                    {!classroom.announcements ||
                    classroom.announcements.length === 0 ? (

                        <p>
                            No announcements yet.
                        </p>

                    ) : (

                        classroom.announcements.map(
                            (announcement, index) => (

                                <div
                                    key={
                                        announcement._id ||
                                        index
                                    }

                                    style={{
                                        border:
                                            "1px solid #ddd",
                                        padding:
                                            "15px",
                                        marginBottom:
                                            "15px",
                                        borderRadius:
                                            "10px"
                                    }}
                                >

                                    <h3>
                                        📢{" "}
                                        {
                                            announcement.title
                                        }
                                    </h3>

                                    <p>
                                        {
                                            announcement.message
                                        }
                                    </p>

                                    {announcement.createdAt && (

                                        <small>

                                            {new Date(
                                                announcement.createdAt
                                            ).toLocaleString()}

                                        </small>

                                    )}

                                </div>

                            )
                        )

                    )}

                </div>

            )}

            {/* ================================= */}
            {/* MATERIALS */}
            {/* ================================= */}

            {activeTab === "materials" && (

                <div>

                    <h2>
                        📚 Learning Materials
                    </h2>

                    {!classroom.materials ||
                    classroom.materials.length === 0 ? (

                        <p>
                            No materials uploaded yet.
                        </p>

                    ) : (

                        classroom.materials.map(
                            (material, index) => (

                                <div
                                    key={
                                        material._id ||
                                        index
                                    }

                                    style={{
                                        border:
                                            "1px solid #ddd",
                                        padding:
                                            "15px",
                                        marginBottom:
                                            "15px",
                                        borderRadius:
                                            "10px"
                                    }}
                                >

                                    <h3>
                                        📄{" "}
                                        {
                                            material.title
                                        }
                                    </h3>

                                    {material.description && (

                                        <p>
                                            {
                                                material.description
                                            }
                                        </p>

                                    )}

                                    {material.file && (

                                        <a
                                            href={material.file}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            ⬇️ Download Material
                                        </a>

                                    )}

                                </div>

                            )
                        )

                    )}

                </div>

            )}

            {/* ================================= */}
            {/* ASSIGNMENTS */}
            {/* ================================= */}

            {activeTab === "assignments" && (

                <div>

                    {/* ================================= */}
                    {/* ASSIGNMENT LIST */}
                    {/* ================================= */}

                    {!selectedAssignment && (

                        <div>

                            <h2>
                                📝 Assignments
                            </h2>

                            {assignments.length === 0 ? (

                                <div>

                                    <h3>
                                        📚 No assignments yet
                                    </h3>

                                    <p>
                                        Your tutor has not created
                                        any assignments for this
                                        classroom yet.
                                    </p>

                                </div>

                            ) : (

                                assignments.map(
                                    (assignment) => (

                                        <AssignmentCard
                                            key={
                                                assignment._id
                                            }
                                            assignment={
                                                assignment
                                            }
                                        />

                                    )
                                )

                            )}

                        </div>

                    )}

                    {/* ================================= */}
                    {/* SELECTED ASSIGNMENT */}
                    {/* ================================= */}

                    {selectedAssignment && (

                        <div>

                            <button
                                onClick={
                                    closeAssignment
                                }
                            >
                                ← Back to Assignments
                            </button>

                            <br />
                            <br />

                            {assignmentLoading ? (

                                <h2>
                                    Loading assignment...
                                </h2>

                            ) : (

                                <div>

                                    {/* ================================= */}
                                    {/* RESULT */}
                                    {/* ================================= */}

                                    {submission &&
                                    submission.mark !== null &&
                                    submission.mark !== undefined && (

                                        <div
                                            style={{
                                                border:
                                                    "2px solid #333",
                                                padding:
                                                    "20px",
                                                marginBottom:
                                                    "25px",
                                                borderRadius:
                                                    "12px"
                                            }}
                                        >

                                            <h2>
                                                🏆 Your Result
                                            </h2>

                                            <h1>

                                                {
                                                    submission.mark
                                                }{" "}

                                                /{" "}

                                                {
                                                    selectedAssignment.totalMarks
                                                }

                                            </h1>

                                            <p>

                                                {selectedAssignment.totalMarks
                                                    ? `${Math.round(
                                                        (
                                                            Number(
                                                                submission.mark
                                                            ) /
                                                            Number(
                                                                selectedAssignment.totalMarks
                                                            )
                                                        ) *
                                                        100
                                                    )}%`
                                                    : ""
                                                }

                                            </p>

                                            {submission.feedback && (

                                                <p>

                                                    <strong>
                                                        Tutor Feedback:
                                                    </strong>{" "}

                                                    {
                                                        submission.feedback
                                                    }

                                                </p>

                                            )}

                                        </div>

                                    )}

                                    {/* ================================= */}
                                    {/* ASSIGNMENT DETAILS */}
                                    {/* ================================= */}

                                    <h2>
                                        📝{" "}
                                        {
                                            selectedAssignment.title
                                        }
                                    </h2>

                                    {selectedAssignment.description && (

                                        <p>
                                            {
                                                selectedAssignment.description
                                            }
                                        </p>

                                    )}

                                    <p>

                                        📅 <strong>Due Date:</strong>{" "}

                                        {selectedAssignment.dueDate
                                            ? new Date(
                                                selectedAssignment.dueDate
                                            ).toLocaleDateString()
                                            : "Not specified"
                                        }

                                    </p>

                                    <p>

                                        🏆 <strong>Total Marks:</strong>{" "}

                                        {
                                            selectedAssignment.totalMarks
                                        }

                                    </p>

                                    {/* ================================= */}
                                    {/* CLOSED MESSAGE */}
                                    {/* ================================= */}

                                    {isAssignmentClosed(
                                        selectedAssignment
                                    ) && (

                                        <div>

                                            <p>
                                                ⚫{" "}
                                                <strong>
                                                    This assignment is closed.
                                                </strong>
                                            </p>

                                            <p>
                                                The due date has passed.
                                                You can still view the
                                                questions, but you can no
                                                longer submit an answer.
                                            </p>

                                        </div>

                                    )}

                                    <hr />

                                    {/* ================================= */}
                                    {/* QUESTIONS */}
                                    {/* ================================= */}

                                    <h3>
                                        Questions
                                    </h3>

                                    {selectedAssignment.questions &&
                                    selectedAssignment.questions.length > 0 ? (

                                        selectedAssignment.questions.map(
                                            (
                                                question,
                                                index
                                            ) => {

                                                // ==============================
                                                // FIND SAVED ANSWER
                                                // ==============================

                                                const existingAnswer =
                                                    submission?.answers?.find(
                                                        (answer) =>
                                                            String(
                                                                answer.questionId
                                                            ) ===
                                                            String(
                                                                question._id
                                                            )
                                                    );

                                                // ==============================
                                                // FIND CURRENT ANSWER
                                                // ==============================

                                                const currentAnswer =
                                                    assignmentAnswers.find(
                                                        (answer) =>
                                                            String(
                                                                answer.questionId
                                                            ) ===
                                                            String(
                                                                question._id
                                                            )
                                                    );

                                                // ==============================
                                                // DISPLAY ANSWER
                                                // ==============================

                                                const displayedAnswer =
                                                    existingAnswer?.answer ??
                                                    currentAnswer?.answer ??
                                                    "";

                                                return (

                                                    <div
                                                        key={
                                                            question._id ||
                                                            index
                                                        }

                                                        style={{
                                                            border:
                                                                "1px solid #ddd",
                                                            padding:
                                                                "20px",
                                                            marginBottom:
                                                                "20px",
                                                            borderRadius:
                                                                "10px"
                                                        }}
                                                    >

                                                        <h4>

                                                            Question{" "}
                                                            {index + 1}

                                                        </h4>

                                                        <p>

                                                            <strong>
                                                                {
                                                                    question.questionText
                                                                }
                                                            </strong>

                                                        </p>

                                                        <p>

                                                            🏆 Marks:{" "}
                                                            {
                                                                question.marks
                                                            }

                                                        </p>

                                                        {/* ============================== */}
                                                        {/* EXISTING SUBMITTED ANSWER */}
                                                        {/* ============================== */}

                                                        {submission ? (

                                                            <div>

                                                                <p>
                                                                    <strong>
                                                                        Your Answer:
                                                                    </strong>
                                                                </p>

                                                                <div
                                                                    style={{
                                                                        border:
                                                                            "1px solid #ccc",
                                                                        padding:
                                                                            "12px",
                                                                        borderRadius:
                                                                            "8px",
                                                                        backgroundColor:
                                                                            "#f7f7f7"
                                                                    }}
                                                                >

                                                                    <p
                                                                        style={{
                                                                            whiteSpace:
                                                                                "pre-wrap"
                                                                        }}
                                                                    >

                                                                        {
                                                                            displayedAnswer ||
                                                                            "No answer submitted."
                                                                        }

                                                                    </p>

                                                                </div>

                                                                {/* ============================== */}
                                                                {/* MARKS */}
                                                                {/* ============================== */}

                                                                {existingAnswer &&
                                                                existingAnswer.marks !== null &&
                                                                existingAnswer.marks !== undefined && (

                                                                    <p>

                                                                        🏆 Marks Obtained:{" "}

                                                                        <strong>

                                                                            {
                                                                                existingAnswer.marks
                                                                            }

                                                                        </strong>

                                                                        /

                                                                        {
                                                                            question.marks
                                                                        }

                                                                    </p>

                                                                )}

                                                                {/* ============================== */}
                                                                {/* CORRECT / INCORRECT */}
                                                                {/* ============================== */}

                                                                {existingAnswer &&
                                                                existingAnswer.correct !== null &&
                                                                existingAnswer.correct !== undefined && (

                                                                    <p>

                                                                        {existingAnswer.correct
                                                                            ? "✅ Correct"
                                                                            : "❌ Incorrect"
                                                                        }

                                                                    </p>

                                                                )}

                                                            </div>

                                                        ) : (

                                                            <textarea
                                                                rows="4"
                                                                placeholder="Enter your answer..."
                                                                value={
                                                                    currentAnswer?.answer ||
                                                                    ""
                                                                }

                                                                disabled={
                                                                    isAssignmentClosed(
                                                                        selectedAssignment
                                                                    )
                                                                }

                                                                onChange={(e) =>
                                                                    updateAnswer(
                                                                        question._id,
                                                                        e.target.value
                                                                    )
                                                                }

                                                                style={{
                                                                    width:
                                                                        "100%",
                                                                    boxSizing:
                                                                        "border-box"
                                                                }}
                                                            />

                                                        )}

                                                    </div>

                                                );

                                            }
                                        )

                                    ) : (

                                        <p>
                                            No questions added.
                                        </p>

                                    )}

                                    {/* ================================= */}
                                    {/* SUBMIT */}
                                    {/* ================================= */}

                                    {!isAssignmentClosed(
                                        selectedAssignment
                                    ) &&
                                    !submission && (

                                        <button
                                            onClick={
                                                submitAssignment
                                            }

                                            disabled={
                                                submittingAssignment
                                            }
                                        >

                                            {submittingAssignment
                                                ? "Submitting..."
                                                : "🚀 Submit Assignment"
                                            }

                                        </button>

                                    )}

                                    {/* ================================= */}
                                    {/* SUBMITTED BUT NOT MARKED */}
                                    {/* ================================= */}

                                    {submission &&
                                    (
                                        submission.mark === null ||
                                        submission.mark === undefined
                                    ) && (

                                        <p>

                                            🟡{" "}
                                            <strong>
                                                Assignment submitted.
                                            </strong>{" "}

                                            Your tutor has not marked
                                            it yet.

                                        </p>

                                    )}

                                </div>

                            )}

                        </div>

                    )}

                </div>

            )}

            {/* ================================= */}
            {/* LESSONS */}
            {/* ================================= */}

            {activeTab === "lessons" && (

                <div>

                    <h2>
                        🎥 Lessons
                    </h2>

                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                            marginBottom: "25px",
                            flexWrap: "wrap"
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

                </div>

            )}

            {/* ================================= */}
            {/* PEOPLE */}
            {/* ================================= */}

            {activeTab === "people" && (

                <div>

                    <h2>
                        👥 People
                    </h2>

                    <h3>
                        👨‍🏫 Tutor
                    </h3>

                    {classroom.tutorId ? (

                        <p>

                            {
                                classroom.tutorId.name
                            }{" "}

                            {
                                classroom.tutorId.surname
                            }

                        </p>

                    ) : (

                        <p>
                            Tutor information unavailable.
                        </p>

                    )}

                    <hr />

                    <h3>
                        👥 Learners
                    </h3>

                    {!classroom.learners ||
                    classroom.learners.length === 0 ? (

                        <p>
                            No learners have joined this
                            classroom yet.
                        </p>

                    ) : (

                        classroom.learners.map(
                            (learner, index) => (

                                <p
                                    key={
                                        learner._id ||
                                        index
                                    }
                                >

                                    👤{" "}

                                    {learner.name}{" "}

                                    {learner.surname}

                                </p>

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

export default Classroom;




