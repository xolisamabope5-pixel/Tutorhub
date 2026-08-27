
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import BackButton from "../components/BackButton";

function TutorMarkSubmission() {

    const { id } = useParams();

    const [submission, setSubmission] = useState(null);

    const [marks, setMarks] = useState([]);

    const [feedback, setFeedback] = useState("");

    const [saving, setSaving] = useState(false);


    // =============================================
    // LOAD SUBMISSION
    // =============================================

    useEffect(() => {

        loadSubmission();

    }, []);


    const loadSubmission = async () => {

        try {

            const response = await fetch(
                `https://tutorhub-api-bz1y.onrender.com/api/submissions/${id}`
            );


            const data = await response.json();


            if (!response.ok) {

                alert(
                    data.message ||
                    "Could not load submission."
                );

                return;

            }


            console.log(
                "SUBMISSION LOADED:",
                data
            );


            setSubmission(data);


            // =============================================
            // LOAD EXISTING MARKS
            // =============================================

            const existingMarks =
                data.answers?.map(
                    (answer) =>
                        answer.marks !== null &&
                        answer.marks !== undefined
                            ? Number(answer.marks)
                            : 0
                ) || [];


            setMarks(existingMarks);


            // =============================================
            // LOAD EXISTING FEEDBACK
            // =============================================

            setFeedback(
                data.feedback || ""
            );


        } catch (error) {

            console.log(
                "Load submission error:",
                error
            );

        }

    };


    // =============================================
    // MARK QUESTION
    // =============================================

    const markQuestion = (
        index,
        value
    ) => {

        const updatedMarks =
            [...marks];


        updatedMarks[index] =
            Number(value);


        setMarks(
            updatedMarks
        );

    };


    // =============================================
    // SAVE MARKS
    // =============================================

    const saveMarks = async () => {

        if (!submission) {

            return;

        }


        // =============================================
        // MAKE SURE EVERY QUESTION HAS A MARK
        // =============================================

        const finalMarks =
            submission.answers.map(
                (answer, index) =>
                    Number(
                        marks[index] || 0
                    )
            );


        // =============================================
        // CALCULATE TOTAL
        // =============================================

        const totalMark =
            finalMarks.reduce(
                (total, mark) =>
                    total + mark,
                0
            );


        console.log(
            "SENDING MARKS:",
            finalMarks
        );

        console.log(
            "TOTAL MARK:",
            totalMark
        );


        try {

            setSaving(true);


            const response =
                await fetch(
                    `https://tutorhub-api-bz1y.onrender.com/api/submissions/${id}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            marks:
                                finalMarks,

                            totalMark:
                                totalMark,

                            feedback:
                                feedback

                        })

                    }
                );


            const data =
                await response.json();


            console.log(
                "SAVE RESPONSE:",
                data
            );


            if (!response.ok) {

                alert(
                    data.message ||
                    "Could not save marks."
                );

                return;

            }


            // =============================================
            // UPDATE LOCAL SUBMISSION
            // =============================================

            setSubmission(
                data
            );


            setMarks(
                data.answers?.map(
                    (answer) =>
                        Number(
                            answer.marks || 0
                        )
                ) || []
            );


            setFeedback(
                data.feedback || ""
            );


            alert(
                "Marks saved successfully 🚀"
            );


        } catch (error) {

            console.log(
                "Save marks error:",
                error
            );


            alert(
                "Could not save marks."
            );

        } finally {

            setSaving(false);

        }

    };


    // =============================================
    // LOADING
    // =============================================

    if (!submission) {

        return (
            <div>

                <h2>
                    Loading submission...
                </h2>

            </div>
        );

    }


    // =============================================
    // QUESTIONS
    // =============================================

    const questions =
        submission.assignmentId?.questions || [];


    // =============================================
    // TOTAL POSSIBLE MARKS
    // =============================================

    const totalPossibleMarks =
        questions.reduce(
            (total, question) =>
                total +
                Number(question.marks || 0),
            0
        );


    // =============================================
    // CURRENT TOTAL
    // =============================================

    const currentTotal =
        marks.reduce(
            (total, mark) =>
                total +
                Number(mark || 0),
            0
        );


    return (

        <div>

            <BackButton />


            <h1>
                👤{" "}
                {submission.learnerId?.name}{" "}
                {submission.learnerId?.surname}
            </h1>


            <h2>
                📝{" "}
                {submission.assignmentId?.title}
            </h2>


            <hr />


            {/* ========================================= */}
            {/* QUESTIONS */}
            {/* ========================================= */}

            {submission.answers?.map(
                (answer, index) => {

                    const question =
                        questions.find(
                            (q) =>
                                String(q._id) ===
                                String(answer.questionId)
                        );


                    const questionMarks =
                        Number(
                            question?.marks || 0
                        );


                    return (

                        <div
                            key={
                                answer.questionId ||
                                index
                            }

                            style={{
                                border:
                                    "1px solid black",

                                padding:
                                    "20px",

                                margin:
                                    "20px 0",

                                borderRadius:
                                    "10px"
                            }}
                        >

                            <h3>
                                Question{" "}
                                {index + 1}
                            </h3>


                            <p>

                                <strong>
                                    {
                                        question?.questionText ||
                                        question?.question ||
                                        "Question unavailable"
                                    }
                                </strong>

                            </p>


                            <p>

                                🏆 Marks:

                                {" "}

                                {questionMarks}

                            </p>


                            <hr />


                            {/* ========================================= */}
                            {/* LEARNER ANSWER */}
                            {/* ========================================= */}

                            <h4>
                                Learner Answer:
                            </h4>


                            <p>

                                {answer.answer ||
                                    "No answer submitted."}

                            </p>


                            <hr />


                            {/* ========================================= */}
                            {/* MARK BUTTONS */}
                            {/* ========================================= */}

                            <button
                                onClick={() =>
                                    markQuestion(
                                        index,
                                        questionMarks
                                    )
                                }
                            >
                                ✅ Correct
                            </button>


                            <button
                                onClick={() =>
                                    markQuestion(
                                        index,
                                        0
                                    )
                                }

                                style={{
                                    marginLeft:
                                        "10px"
                                }}
                            >
                                ❌ Wrong
                            </button>


                            {/* ========================================= */}
                            {/* CURRENT MARK */}
                            {/* ========================================= */}

                            <p>

                                Mark:

                                {" "}

                                <strong>
                                    {
                                        marks[index] ||
                                        0
                                    }
                                </strong>

                                {" / "}

                                {questionMarks}

                            </p>

                        </div>

                    );

                }
            )}


            {/* ========================================= */}
            {/* TOTAL */}
            {/* ========================================= */}

            <div
                style={{
                    border:
                        "2px solid black",

                    padding:
                        "20px",

                    borderRadius:
                        "10px",

                    marginTop:
                        "30px"
                }}
            >

                <h2>
                    🏆 Total:
                </h2>


                <h1>

                    {currentTotal}

                    {" / "}

                    {totalPossibleMarks}

                </h1>

            </div>


            {/* ========================================= */}
            {/* FEEDBACK */}
            {/* ========================================= */}

            <div
                style={{
                    marginTop:
                        "30px"
                }}
            >

                <h3>
                    Tutor Feedback
                </h3>


                <textarea

                    rows="5"

                    value={
                        feedback
                    }

                    onChange={(e) =>
                        setFeedback(
                            e.target.value
                        )
                    }

                    placeholder="Write feedback for the learner..."

                    style={{
                        width:
                            "100%",

                        maxWidth:
                            "600px",

                        boxSizing:
                            "border-box",

                        padding:
                            "10px"
                    }}

                />

            </div>


            {/* ========================================= */}
            {/* SAVE */}
            {/* ========================================= */}

            <button

                onClick={
                    saveMarks
                }

                disabled={
                    saving
                }

                style={{
                    marginTop:
                        "20px",

                    padding:
                        "12px 20px"
                }}

            >

                {saving
                    ? "Saving..."
                    : "💾 Save Marks"
                }

            </button>


            <br />
            <br />

            <BackButton />

        </div>

    );

}

export default TutorMarkSubmission;


