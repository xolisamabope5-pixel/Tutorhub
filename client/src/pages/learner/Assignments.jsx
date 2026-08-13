
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../../components/BackButton";

function Assignments() {

    const navigate = useNavigate();

    const [learner, setLearner] = useState(null);

    const [assignments, setAssignments] = useState([]);

    const [selectedAssignment, setSelectedAssignment] =
        useState(null);

    const [assignmentAnswers, setAssignmentAnswers] =
        useState([]);

    const [submission, setSubmission] = useState(null);

    const [loading, setLoading] = useState(true);

    const [assignmentLoading, setAssignmentLoading] =
        useState(false);

    const [submittingAssignment, setSubmittingAssignment] =
        useState(false);


    // ==============================
    // LOAD ASSIGNMENTS
    // ==============================

    useEffect(() => {

        loadAssignments();

    }, []);


    const loadAssignments = async () => {

        try {

            setLoading(true);

            const savedLearner =
                localStorage.getItem("learner");

            if (!savedLearner) {

                setLoading(false);

                return;

            }


            const learnerData =
                JSON.parse(savedLearner);

            setLearner(learnerData);


            const classResponse = await fetch(
                `http://localhost:5000/api/classes/program/${learnerData.programId._id}/${learnerData.grade}`
            );


            const classes =
                await classResponse.json();


            const joinedClasses =
                classes.filter((item) =>

                    item.learners?.some(
                        (person) =>

                            person._id.toString() ===
                            learnerData._id.toString()

                    )

                );


            let allAssignments = [];


            for (const classroom of joinedClasses) {

                const assignmentResponse =
                    await fetch(
                        `http://localhost:5000/api/assignments/class/${classroom._id}`
                    );


                const classAssignments =
                    await assignmentResponse.json();


                const updatedAssignments =
                    classAssignments.map(
                        (assignment) => ({

                            ...assignment,

                            className:
                                classroom.className,

                            subject:
                                classroom.subject

                        })
                    );


                allAssignments.push(
                    ...updatedAssignments
                );

            }


            setAssignments(allAssignments);


        } catch (error) {

            console.log(
                "Error loading assignments:",
                error
            );

        } finally {

            setLoading(false);

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
    // CHECK DUE DATE
    // ==============================

    const isAssignmentClosed = (
        assignment
    ) => {

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
    // OPEN ASSIGNMENT
    // ==============================

    const openAssignment = async (
        assignmentId
    ) => {

        try {

            setAssignmentLoading(true);

            setSelectedAssignment(null);

            setSubmission(null);

            setAssignmentAnswers([]);


            // ==============================
            // GET ASSIGNMENT
            // ==============================

            const response =
                await fetch(
                    `http://localhost:5000/api/assignments/${assignmentId}`
                );


            const data =
                await response.json();


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
                            `http://localhost:5000/api/submissions/learner/${learnerId}/${assignmentId}`
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

        if (
            isAssignmentClosed(
                selectedAssignment
            )
        ) {

            alert(
                "This assignment is no longer accepting submissions."
            );

            return;

        }


        // ==============================
        // GET LEARNER
        // ==============================

        const learner =
            getLoggedInLearner();


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

        const finalAnswers =
            selectedAssignment.questions.map(
                (question) => {

                    const existingAnswer =
                        assignmentAnswers.find(
                            (item) =>

                                String(
                                    item.questionId
                                ) ===
                                String(
                                    question._id
                                )
                        );


                    return {

                        questionId:
                            question._id,

                        answer:
                            existingAnswer?.answer ||
                            ""

                    };

                }
            );


        // ==============================
        // CHECK UNANSWERED
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
                    "http://localhost:5000/api/submissions/create",
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


            setSubmission({

                ...data,

                answers:
                    data.answers ||
                    finalAnswers

            });


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
    // LOADING
    // ==============================

    if (loading) {

        return (

            <div>

                <h2>
                    📝 Loading assignments...
                </h2>

            </div>

        );

    }


    // ==============================
    // MAIN
    // ==============================

    return (

        <div>


            {/* ================================= */}
            {/* ASSIGNMENT LIST */}
            {/* ================================= */}

            {!selectedAssignment && (

                <div>

                    <h1>
                        📝 Assignments
                    </h1>


                    {assignments.length === 0 ? (

                        <p>
                            No assignments yet.
                        </p>

                    ) : (

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fill, minmax(250px, 1fr))",
                                gap: "18px"
                            }}
                        >

                            {assignments.map(
                                (item) => {

                                    const closed =
                                        isAssignmentClosed(
                                            item
                                        );


                                    return (

                                        <div

                                            key={
                                                item._id
                                            }

                                            style={{
                                                border:
                                                    "1px solid #ddd",

                                                padding:
                                                    "15px",

                                                borderRadius:
                                                    "10px",

                                                backgroundColor:
                                                    "#fff"
                                            }}

                                        >

                                            <h3
                                                style={{
                                                    marginTop:
                                                        "0"
                                                }}
                                            >

                                                📝{" "}
                                                {
                                                    item.title
                                                }

                                            </h3>


                                            <h4>

                                                📚{" "}
                                                {
                                                    item.className
                                                }

                                            </h4>


                                            <p>

                                                {
                                                    item.subject
                                                }

                                            </p>


                                            {item.description && (

                                                <p>

                                                    {
                                                        item.description
                                                    }

                                                </p>

                                            )}


                                            <p>

                                                📅{" "}
                                                <strong>
                                                    Due:
                                                </strong>{" "}

                                                {
                                                    item.dueDate

                                                        ? new Date(
                                                            item.dueDate
                                                        ).toLocaleDateString()

                                                        : "Not specified"
                                                }

                                            </p>


                                            <p>

                                                🏆{" "}
                                                <strong>
                                                    Marks:
                                                </strong>{" "}

                                                {
                                                    item.totalMarks
                                                }

                                            </p>


                                            <p>

                                                {
                                                    closed

                                                        ? "⚫ Assignment Completed"

                                                        : "🟢 Assignment Open"
                                                }

                                            </p>


                                            <button

                                                onClick={() =>
                                                    openAssignment(
                                                        item._id
                                                    )
                                                }

                                            >

                                                {
                                                    closed

                                                        ? "👁️ View Assignment"

                                                        : "✍️ Open Assignment"
                                                }

                                            </button>


                                        </div>

                                    );

                                }
                            )}

                        </div>

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

                                        {
                                            selectedAssignment.totalMarks
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

                                📅{" "}
                                <strong>
                                    Due Date:
                                </strong>{" "}

                                {
                                    selectedAssignment.dueDate

                                        ? new Date(
                                            selectedAssignment.dueDate
                                        ).toLocaleDateString()

                                        : "Not specified"
                                }

                            </p>


                            <p>

                                🏆{" "}
                                <strong>
                                    Total Marks:
                                </strong>{" "}

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


                                                {/* ================================= */}
                                                {/* EXISTING SUBMITTED ANSWER */}
                                                {/* ================================= */}

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


                                                        {/* ================================= */}
                                                        {/* MARKS */}
                                                        {/* ================================= */}

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

                                                                /{" "}

                                                                {
                                                                    question.marks
                                                                }

                                                            </p>

                                                        )}


                                                        {/* ================================= */}
                                                        {/* CORRECT / INCORRECT */}
                                                        {/* ================================= */}

                                                        {existingAnswer &&
                                                        existingAnswer.correct !== null &&
                                                        existingAnswer.correct !== undefined && (

                                                            <p>

                                                                {
                                                                    existingAnswer.correct

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

                                    {
                                        submittingAssignment

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


            <br />
            <br />


            <BackButton />

        </div>

    );

}

export default Assignments;

