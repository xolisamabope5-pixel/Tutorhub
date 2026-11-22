import API_URL from "../../api.js";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BackButton from "../../components/BackButton";

const API = `${API_URL}`;
const learnerAuthHeaders = (json = false) => {
    let token = "";
    try { token = JSON.parse(localStorage.getItem("learner") || "null")?.token || ""; } catch { /* no session */ }
    return { ...(json ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

function LearnerDocumentAssignment() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [learner, setLearner] = useState(null);
    const [assignment, setAssignment] = useState(null);
    const [submission, setSubmission] = useState(null);

    const [selectedFiles, setSelectedFiles] = useState([]);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const loadData = async () => {

        try {

            setLoading(true);

            const savedLearner =
                localStorage.getItem("learner");

            if (!savedLearner) {
                navigate("/login");
                return;
            }

            const learnerData =
                JSON.parse(savedLearner);

            setLearner(learnerData);


            // ==============================
            // LOAD ASSIGNMENT
            // ==============================

            const assignmentResponse =
                await fetch(
                    `${API}/api/document-assignments/${id}`,
                    { headers: learnerAuthHeaders() }
                );

            if (!assignmentResponse.ok) {
                throw new Error(
                    "Could not load document assignment."
                );
            }

            const assignmentData =
                await assignmentResponse.json();

            setAssignment(assignmentData);


            // ==============================
            // LOAD EXISTING SUBMISSION
            // ==============================

            const submissionResponse =
                await fetch(
                    `${API}/api/document-submissions/learner/${learnerData._id}/${id}`,
                    { headers: learnerAuthHeaders() }
                );

            if (submissionResponse.ok) {

                const submissionData =
                    await submissionResponse.json();

                setSubmission(submissionData);

            } else {

                setSubmission(null);

            }

        } catch (error) {

            console.error(
                "Error loading document assignment:",
                error
            );

            alert(
                "Could not load this document assignment."
            );

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        loadData();

    }, [id]);


    // ==============================
    // FILE SELECTION
    // ==============================

    const handleFileChange = (event) => {

        const files =
            Array.from(event.target.files || []);

        setSelectedFiles(files);

    };


    // ==============================
    // SUBMIT DOCUMENT
    // ==============================

    const submitWork = async () => {

        if (!learner) {
            alert("Learner information is missing.");
            return;
        }

        if (!selectedFiles.length) {
            alert(
                "Please select at least one file."
            );
            return;
        }

        if (
            submission &&
            submission.mark !== null &&
            submission.mark !== undefined
        ) {

            alert(
                "This submission has already been marked and cannot be changed."
            );

            return;

        }


        try {

            setSubmitting(true);

            const formData =
                new FormData();

            formData.append(
                "assignmentId",
                assignment._id
            );

            formData.append(
                "learnerId",
                learner._id
            );


            selectedFiles.forEach((file) => {

                formData.append(
                    "files",
                    file
                );

            });


            const response =
                await fetch(
                    `${API}/api/document-submissions/create`,
                    {
                        method: "POST",
                        headers: learnerAuthHeaders(),
                        body: formData
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Could not submit your work."
                );

            }


            setSubmission(data.submission);

            setSelectedFiles([]);

            alert(
                "Your work has been submitted successfully."
            );


        } catch (error) {

            console.error(
                "Submission error:",
                error
            );

            alert(
                error.message ||
                "Could not submit your work."
            );

        } finally {

            setSubmitting(false);

        }

    };


    // ==============================
    // LOADING
    // ==============================

    if (loading) {

        return (

            <div>

                <BackButton />

                <h2>
                    Loading assignment...
                </h2>

            </div>

        );

    }


    if (!assignment) {

        return (

            <div>

                <BackButton />

                <h2>
                    Assignment not found.
                </h2>

            </div>

        );

    }


    const dueDate =
        new Date(assignment.dueDate);

    const closed =
        dueDate.setHours(
            23,
            59,
            59,
            999
        ) < new Date().getTime();


    const marked =
        submission &&
        submission.mark !== null &&
        submission.mark !== undefined;


    return (

        <div>

            <BackButton />

            <button
                type="button"
                onClick={() =>
                    navigate("/learner/assignments")
                }
            >
                ? Back to Assignments
            </button>


            <hr />


            {/* ============================== */}
            {/* ASSIGNMENT INFORMATION */}
            {/* ============================== */}

            <h1>
                {assignment.title}
            </h1>


            <p>

                <strong>
                    Total Marks:
                </strong>{" "}

                {assignment.totalMarks}

            </p>


            <p>

                <strong>
                    Due Date:
                </strong>{" "}

                {new Date(
                    assignment.dueDate
                ).toLocaleString()}

            </p>


            <p>

                <strong>
                    Status:
                </strong>{" "}

                {closed
                    ? "Assignment Closed"
                    : "Assignment Open"}

            </p>


            {assignment.description && (

                <div>

                    <h3>
                        Instructions
                    </h3>

                    <p>
                        {assignment.description}
                    </p>

                </div>

            )}


            {/* ============================== */}
            {/* TEACHER DOCUMENT */}
            {/* ============================== */}

            <div>

                <h2>
                    Assignment Document
                </h2>


                {assignment.documentName && (

                    <p>

                        <strong>
                            File:
                        </strong>{" "}

                        {assignment.documentName}

                    </p>

                )}


                {assignment.document && (

                    <button
                        type="button"
                        onClick={() => window.location.href = `${API}/api/document-assignments/view/${assignment._id}`}
                    >
                        Open / Download Assignment
                    </button>

                )}

            </div>


            <hr />


            {/* ============================== */}
            {/* EXISTING SUBMISSION */}
            {/* ============================== */}

            <div>

                <h2>
                    Your Submission
                </h2>


                {!submission && (

                    <p>
                        You have not submitted your work yet.
                    </p>

                )}


                {submission && (

                    <div>

                        <p>

                            <strong>
                                Status:
                            </strong>{" "}

                            {submission.status}

                        </p>


                        {submission.files?.length > 0 && (

                            <div>

                                <h3>
                                    Submitted Files
                                </h3>

                                {submission.files.map(
                                    (file, index) => (

                                        <p
                                            key={index}
                                        >

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    window.dispatchEvent(new CustomEvent("tutorhub:open-resource", { detail: { url: file.url } }))
                                                }
                                            >
                                                {file.name ||
                                                    `Submitted File ${index + 1}`}
                                            </button>

                                        </p>

                                    )
                                )}

                            </div>

                        )}


                        {marked && (

                            <div>

                                <hr />

                                <h3>
                                    Result
                                </h3>

                                <p>

                                    <strong>
                                        Mark:
                                    </strong>{" "}

                                    {submission.mark} /{" "}
                                    {assignment.totalMarks}

                                </p>


                                {submission.feedback && (

                                    <div>

                                        <strong>
                                            Tutor Feedback:
                                        </strong>

                                        <p>
                                            {submission.feedback}
                                        </p>

                                    </div>

                                )}


                                {submission.markedDocument && (

                                    <button
                                        type="button"
                                        onClick={() =>
                                            window.dispatchEvent(new CustomEvent("tutorhub:open-resource", { detail: { url: submission.markedDocument } }))
                                        }
                                    >
                                        View Marked Document
                                    </button>

                                )}

                            </div>

                        )}

                    </div>

                )}

            </div>


            {/* ============================== */}
            {/* SUBMIT WORK */}
            {/* ============================== */}

            {!marked && !closed && (

                <div>

                    <hr />

                    <h2>
                        Submit Your Work
                    </h2>


                    <p>
                        Upload your completed assignment below.
                    </p>


                    <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                    />


                    {selectedFiles.length > 0 && (

                        <div>

                            <h3>
                                Files Selected
                            </h3>

                            {selectedFiles.map(
                                (file, index) => (

                                    <p key={index}>
                                        {file.name}
                                    </p>

                                )
                            )}

                        </div>

                    )}


                    <button
                        type="button"
                        disabled={
                            submitting ||
                            selectedFiles.length === 0
                        }
                        onClick={submitWork}
                    >

                        {submitting
                            ? "Submitting..."
                            : "Submit Assignment"}

                    </button>

                </div>

            )}


            {closed && !marked && (

                <p>
                    This assignment is closed and can no longer
                    receive submissions.
                </p>

            )}

        </div>

    );

}

export default LearnerDocumentAssignment;


