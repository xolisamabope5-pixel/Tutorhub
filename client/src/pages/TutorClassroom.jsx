
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";

function TutorClassroom() {

    const { id } = useParams();
    const navigate = useNavigate();

    // ==============================
    // CLASSROOM
    // ==============================

    const [classroom, setClassroom] = useState(null);

    // ==============================
    // TABS
    // ==============================

    const [activeTab, setActiveTab] = useState(
        new URLSearchParams(window.location.search).get("tab") || "stream"
    );

    // ==============================
    // LESSON VIEW
    // ==============================

    const [lessonView, setLessonView] = useState("live");

    // ==============================
    // ASSIGNMENTS
    // ==============================

    const [assignments, setAssignments] = useState([]);

    // ==============================
    // LESSONS
    // ==============================

    const [lessons, setLessons] = useState([]);

    // ==============================
    // FORMS
    // ==============================

    const [showLessonForm, setShowLessonForm] = useState(false);
    const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
    const [showMaterialForm, setShowMaterialForm] = useState(false);
    const [showAssignmentForm, setShowAssignmentForm] = useState(false);

    // ==============================
    // CURRENT TIME
    // ==============================

    const [, setCurrentTime] = useState(new Date());

    // ==============================
    // LESSON
    // ==============================

    const [lesson, setLesson] = useState({
        title: "",
        description: "",
        date: "",
        time: "",
        duration: 60
    });

    // ==============================
    // ANNOUNCEMENT
    // ==============================

    const [announcement, setAnnouncement] = useState({
        title: "",
        message: ""
    });

    // ==============================
    // MATERIAL
    // ==============================

    const [material, setMaterial] = useState({
        title: "",
        description: "",
        file: null
    });

    // ==============================
    // ASSIGNMENT
    // ==============================

    const [assignment, setAssignment] = useState({
        title: "",
        description: "",
        dueDate: "",
        totalMarks: "",
        questions: [
            {
                questionText: "",
                marks: ""
            }
        ]
    });

    // ==============================
    // LOAD DATA
    // ==============================

    useEffect(() => {

        fetchClassroom();
        fetchAssignments();
        fetchLessons();

    }, [id]);

    // ==============================
    // LIVE CLOCK
    // ==============================

    useEffect(() => {

        const timer = setInterval(() => {

            setCurrentTime(new Date());

        }, 1000);

        return () => clearInterval(timer);

    }, []);

    // ==============================
    // CHANGE TAB
    // ==============================

    const changeTab = (tab) => {

        setActiveTab(tab);

        const params = new URLSearchParams(
            window.location.search
        );

        params.set("tab", tab);

        window.history.replaceState(
            null,
            "",
            `${window.location.pathname}?${params.toString()}`
        );

    };

    // ==============================
    // FETCH CLASSROOM
    // ==============================

    const fetchClassroom = async () => {

        try {

            const response = await fetch(
                `https://tutorhub-api-bz1y.onrender.com/api/classes/${id}`
            );

            const data = await response.json();

            if (response.ok) {

                setClassroom(data);

            } else {

                console.log(
                    data.message ||
                    "Could not load classroom"
                );

            }

        } catch (error) {

            console.log(
                "Error loading tutor classroom:",
                error
            );

        }

    };

    // ==============================
    // FETCH ASSIGNMENTS
    // ==============================

    const fetchAssignments = async () => {

        try {

            const response = await fetch(
                `https://tutorhub-api-bz1y.onrender.com/api/assignments/class/${id}`
            );

            const data = await response.json();

            if (response.ok) {

                setAssignments(
                    Array.isArray(data)
                        ? data
                        : []
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

    const fetchLessons = async () => {

        try {

            const response = await fetch(
                `https://tutorhub-api-bz1y.onrender.com/api/lessons/class/${id}`
            );

            const data = await response.json();

            if (response.ok) {

                setLessons(
                    Array.isArray(data)
                        ? data
                        : []
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
    // LESSON STATUS
    // ==============================

    const getLessonStatus = (item) => {

        if (!item.date || !item.time) {

            return "upcoming";

        }

        try {

            const startTime = new Date(
                `${item.date}T${item.time}`
            );

            let endTime;

            if (item.endsAt) {

                endTime = new Date(
                    `${item.date}T${item.endsAt}`
                );

            } else {

                endTime = new Date(
                    startTime.getTime() +
                    Number(item.duration || 60) *
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
        (item) =>
            getLessonStatus(item) === "live"
    );

    const upcomingLessons = lessons
        .filter(
            (item) =>
                getLessonStatus(item) === "upcoming"
        )
        .sort(
            (a, b) =>
                new Date(`${a.date}T${a.time}`) -
                new Date(`${b.date}T${b.time}`)
        );

    const completedLessons = lessons
        .filter(
            (item) =>
                getLessonStatus(item) === "completed"
        )
        .sort(
            (a, b) =>
                new Date(`${b.date}T${b.time}`) -
                new Date(`${a.date}T${a.time}`)
        );

    // ==============================
    // CREATE LESSON
    // ==============================

    const createLesson = async (e) => {

        e.preventDefault();

        if (!classroom?.tutorId?._id) {

            alert(
                "Tutor information is not available."
            );

            return;

        }

        try {

            const response = await fetch(
                "https://tutorhub-api-bz1y.onrender.com/api/lessons/create",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        classId: id,

                        tutorId:
                            classroom.tutorId._id,

                        title:
                            lesson.title,

                        description:
                            lesson.description,

                        date:
                            lesson.date,

                        time:
                            lesson.time,

                        duration:
                            Number(
                                lesson.duration
                            )

                    })
                }
            );

            const data =
                await response.json();

            if (response.ok) {

                alert(
                    "Lesson created successfully 🚀"
                );

                setLesson({

                    title: "",
                    description: "",
                    date: "",
                    time: "",
                    duration: 60

                });

                setShowLessonForm(false);

                fetchLessons();

            } else {

                alert(
                    data.message ||
                    "Failed to create lesson"
                );

            }

        } catch (error) {

            console.log(error);

            alert(
                "Could not create lesson"
            );

        }

    };

    // ==============================
    // DELETE LESSON
    // ==============================

    const deleteLesson = async (
        lessonId,
        lessonTitle
    ) => {

        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${lessonTitle}"?`
            );

        if (!confirmed) {

            return;

        }

        try {

            const response = await fetch(
                `https://tutorhub-api-bz1y.onrender.com/api/lessons/${lessonId}`,
                {
                    method: "DELETE"
                }
            );

            const data =
                await response.json();

            if (response.ok) {

                alert(
                    "Lesson deleted successfully 🗑️"
                );

                fetchLessons();

            } else {

                alert(
                    data.message ||
                    "Failed to delete lesson"
                );

            }

        } catch (error) {

            console.log(
                "Delete lesson error:",
                error
            );

            alert(
                "Could not delete lesson"
            );

        }

    };

    // ==============================
    // ADD RECORDING
    // ==============================

    const addRecording = async (item) => {

        const recordingLink =
            prompt(
                "Paste the YouTube recording link:"
            );

        if (!recordingLink) {

            return;

        }

        try {

            const response = await fetch(
                `https://tutorhub-api-bz1y.onrender.com/api/lessons/${item._id}/recording`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        recordingLink:
                            recordingLink.trim()

                    })
                }
            );

            const data =
                await response.json();

            if (response.ok) {

                alert(
                    "Recording added successfully 🎬"
                );

                fetchLessons();

            } else {

                alert(
                    data.message ||
                    "Failed to add recording"
                );

            }

        } catch (error) {

            console.log(
                "Add recording error:",
                error
            );

            alert(
                "Could not add recording"
            );

        }

    };

    // ==============================
    // JOIN / ENTER JITSI
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
    // CREATE ANNOUNCEMENT
    // ==============================

    const createAnnouncement = async (e) => {

        e.preventDefault();

        try {

            const response = await fetch(
                `https://tutorhub-api-bz1y.onrender.com/api/classes/${id}/announcement`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        title:
                            announcement.title,

                        message:
                            announcement.message

                    })
                }
            );

            const data =
                await response.json();

            if (response.ok) {

                alert(
                    "Announcement created 🚀"
                );

                setAnnouncement({

                    title: "",
                    message: ""

                });

                setShowAnnouncementForm(false);

                fetchClassroom();

            } else {

                alert(
                    data.message ||
                    "Failed to create announcement"
                );

            }

        } catch (error) {

            console.log(error);

            alert(
                "Could not create announcement"
            );

        }

    };

    // ==============================
    // DELETE ANNOUNCEMENT
    // ==============================

    const deleteAnnouncement = async (
        announcementId,
        announcementTitle
    ) => {

        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${announcementTitle}"?`
            );

        if (!confirmed) {

            return;

        }

        try {

            const response = await fetch(
                `https://tutorhub-api-bz1y.onrender.com/api/classes/${id}/announcement/${announcementId}`,
                {
                    method: "DELETE"
                }
            );

            const data =
                await response.json();

            if (response.ok) {

                alert(
                    "Announcement deleted successfully 🗑️"
                );

                fetchClassroom();

            } else {

                alert(
                    data.message ||
                    "Failed to delete announcement"
                );

            }

        } catch (error) {

            console.log(
                "Delete announcement error:",
                error
            );

            alert(
                "Could not delete announcement"
            );

        }

    };

    // ==============================
    // ADD QUESTION
    // ==============================

    const addQuestion = () => {

        setAssignment({

            ...assignment,

            questions: [

                ...assignment.questions,

                {
                    questionText: "",
                    marks: ""
                }

            ]

        });

    };

    // ==============================
    // REMOVE QUESTION
    // ==============================

    const removeQuestion = (index) => {

        const updatedQuestions =
            assignment.questions.filter(
                (_, i) =>
                    i !== index
            );

        setAssignment({

            ...assignment,

            questions:
                updatedQuestions

        });

    };

    // ==============================
    // CREATE ASSIGNMENT
    // ==============================

    const createAssignment = async (e) => {

        e.preventDefault();

        if (!classroom?.tutorId?._id) {

            alert(
                "Tutor information is not available."
            );

            return;

        }

        try {

            const response = await fetch(
                "https://tutorhub-api-bz1y.onrender.com/api/assignments/create",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        classId: id,

                        tutorId:
                            classroom.tutorId._id,

                        title:
                            assignment.title,

                        description:
                            assignment.description,

                        dueDate:
                            assignment.dueDate,

                        totalMarks:
                            Number(
                                assignment.totalMarks
                            ),

                        questions:
                            assignment.questions.map(
                                (question) => ({

                                    questionText:
                                        question.questionText,

                                    marks:
                                        Number(
                                            question.marks
                                        )

                                })
                            )

                    })
                }
            );

            const data =
                await response.json();

            if (response.ok) {

                alert(
                    "Assignment created 🚀"
                );

                setAssignment({

                    title: "",
                    description: "",
                    dueDate: "",
                    totalMarks: "",

                    questions: [
                        {
                            questionText: "",
                            marks: ""
                        }
                    ]

                });

                setShowAssignmentForm(false);

                fetchAssignments();

            } else {

                alert(
                    data.message ||
                    "Failed to create assignment"
                );

            }

        } catch (error) {

            console.log(error);

            alert(
                "Could not create assignment"
            );

        }

    };

    // ==============================
    // DELETE ASSIGNMENT
    // ==============================

    const deleteAssignment = async (
        assignmentId,
        assignmentTitle
    ) => {

        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${assignmentTitle}"?`
            );

        if (!confirmed) {

            return;

        }

        try {

            const response = await fetch(
                `https://tutorhub-api-bz1y.onrender.com/api/assignments/${assignmentId}`,
                {
                    method: "DELETE"
                }
            );

            const data =
                await response.json();

            if (response.ok) {

                alert(
                    "Assignment deleted successfully 🗑️"
                );

                fetchAssignments();

            } else {

                alert(
                    data.message ||
                    "Failed to delete assignment"
                );

            }

        } catch (error) {

            console.log(
                "Delete assignment error:",
                error
            );

            alert(
                "Could not delete assignment"
            );

        }

    };

    // ==============================
    // UPLOAD MATERIAL
    // ==============================

    const uploadMaterial = async (e) => {

        e.preventDefault();

        if (!material.file) {

            alert(
                "Please select a file first."
            );

            return;

        }

        if (!classroom?.tutorId?._id) {

            alert(
                "Tutor information is not available."
            );

            return;

        }

        try {

            const formData =
                new FormData();

            formData.append(
                "title",
                material.title
            );

            formData.append(
                "description",
                material.description
            );

            formData.append(
                "classId",
                id
            );

            formData.append(
                "uploadedBy",
                classroom.tutorId._id
            );

            formData.append(
                "file",
                material.file
            );

            const response =
                await fetch(
                    "https://tutorhub-api-bz1y.onrender.com/api/materials/upload",
                    {
                        method: "POST",
                        body: formData
                    }
                );

            const data =
                await response.json();

            if (response.ok) {

                alert(
                    "Material uploaded 🚀"
                );

                setMaterial({

                    title: "",
                    description: "",
                    file: null

                });

                setShowMaterialForm(false);

                fetchClassroom();

            } else {

                alert(
                    data.message ||
                    "Upload failed"
                );

            }

        } catch (error) {

            console.log(error);

            alert(
                "Could not upload material"
            );

        }

    };

    // ==============================
    // DELETE MATERIAL
    // ==============================

    const deleteMaterial = async (
        materialId,
        materialTitle
    ) => {

        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${materialTitle}"?`
            );

        if (!confirmed) {

            return;

        }

        try {

            const response =
                await fetch(
                    `https://tutorhub-api-bz1y.onrender.com/api/materials/${materialId}`,
                    {
                        method: "DELETE"
                    }
                );

            const data =
                await response.json();

            if (response.ok) {

                alert(
                    "Material deleted successfully 🗑️"
                );

                fetchClassroom();

            } else {

                alert(
                    data.message ||
                    "Failed to delete material"
                );

            }

        } catch (error) {

            console.log(
                "Delete material error:",
                error
            );

            alert(
                "Could not delete material"
            );

        }

    };

    // ==============================
    // LOADING
    // ==============================

    if (!classroom) {

        return (

            <div style={styles.page}>

                <div style={styles.loadingCard}>

                    <h2>
                        📚 Loading classroom...
                    </h2>

                </div>

            </div>

        );

    }

    // ==============================
    // SAFE DATA
    // ==============================

    const announcements =
        classroom.announcements || [];

    const materials =
        classroom.materials || [];

    const learners =
        classroom.learners || [];

    // ==============================
    // MAIN
    // ==============================

    return (

        <div style={styles.page}>

            <div style={styles.container}>

                {/* ================================= */}
                {/* CLASSROOM HEADER */}
                {/* ================================= */}

                <div style={styles.header}>

                    <button
                        style={styles.backButton}
                        onClick={() =>
                            navigate(-1)
                        }
                    >
                        ← Back
                    </button>

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

                {/* ================================= */}
                {/* NAVIGATION */}
                {/* ================================= */}

                <div style={styles.navigation}>

                    <button
                        style={
                            activeTab === "stream"
                                ? styles.activeTab
                                : styles.tab
                        }
                        onClick={() =>
                            changeTab("stream")
                        }
                    >
                        📢 Stream
                    </button>

                    <button
                        style={
                            activeTab === "materials"
                                ? styles.activeTab
                                : styles.tab
                        }
                        onClick={() =>
                            changeTab("materials")
                        }
                    >
                        📚 Materials
                    </button>

                    <button
                        style={
                            activeTab === "assignments"
                                ? styles.activeTab
                                : styles.tab
                        }
                        onClick={() =>
                            changeTab("assignments")
                        }
                    >
                        📝 Assignments
                    </button>

                    <button
                        style={
                            activeTab === "lessons"
                                ? styles.activeTab
                                : styles.tab
                        }
                        onClick={() =>
                            changeTab("lessons")
                        }
                    >
                        🎥 Lessons
                    </button>

                    <button
                        style={
                            activeTab === "people"
                                ? styles.activeTab
                                : styles.tab
                        }
                        onClick={() =>
                            changeTab("people")
                        }
                    >
                        👥 People
                    </button>

                </div>

                {/* ================================= */}
                {/* STREAM */}
                {/* ================================= */}

                {activeTab === "stream" && (

                    <div>

                        <div style={styles.sectionHeader}>

                            <div>

                                <h2>
                                    📢 Announcements
                                </h2>

                                <p>
                                    Share announcements and
                                    important updates with
                                    your learners.
                                </p>

                            </div>

                            <button
                                onClick={() =>
                                    setShowAnnouncementForm(
                                        !showAnnouncementForm
                                    )
                                }
                            >
                                {showAnnouncementForm
                                    ? "Cancel"
                                    : "+ New Announcement"
                                }
                            </button>

                        </div>

                        {showAnnouncementForm && (

                            <div style={styles.formCard}>

                                <h3>
                                    Create Announcement
                                </h3>

                                <form
                                    onSubmit={
                                        createAnnouncement
                                    }
                                >

                                    <label>
                                        Title
                                    </label>

                                    <input
                                        style={
                                            styles.input
                                        }
                                        type="text"
                                        placeholder="e.g. Test tomorrow"
                                        value={
                                            announcement.title
                                        }
                                        onChange={(e) =>
                                            setAnnouncement({
                                                ...announcement,
                                                title:
                                                    e.target.value
                                            })
                                        }
                                        required
                                    />

                                    <label>
                                        Message
                                    </label>

                                    <textarea
                                        style={
                                            styles.textarea
                                        }
                                        placeholder="Write your announcement..."
                                        value={
                                            announcement.message
                                        }
                                        onChange={(e) =>
                                            setAnnouncement({
                                                ...announcement,
                                                message:
                                                    e.target.value
                                            })
                                        }
                                        required
                                    />

                                    <button
                                        type="submit"
                                    >
                                        🚀 Publish Announcement
                                    </button>

                                </form>

                            </div>

                        )}

                        <hr />

                        {announcements.length === 0 ? (

                            <div style={styles.emptyCard}>

                                <h3>
                                    📢 No announcements yet
                                </h3>

                                <p>
                                    Create your first
                                    announcement to keep
                                    learners informed.
                                </p>

                            </div>

                        ) : (

                            announcements.map(
                                (item, index) => (

                                    <div
                                        key={
                                            item._id ||
                                            index
                                        }
                                        style={styles.card}
                                    >

                                        <h3>
                                            📢{" "}
                                            {item.title}
                                        </h3>

                                        <p>
                                            {item.message}
                                        </p>

                                        {item.createdAt && (

                                            <small>

                                                {new Date(
                                                    item.createdAt
                                                ).toLocaleString()}

                                            </small>

                                        )}

                                        <br />
                                        <br />

                                        <button
                                            onClick={() =>
                                                deleteAnnouncement(
                                                    item._id,
                                                    item.title
                                                )
                                            }
                                        >
                                            🗑️ Delete
                                        </button>

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

                        <div style={styles.sectionHeader}>

                            <div>

                                <h2>
                                    📚 Learning Materials
                                </h2>

                                <p>
                                    Upload notes, documents
                                    and resources for your
                                    learners.
                                </p>

                            </div>

                            <button
                                onClick={() =>
                                    setShowMaterialForm(
                                        !showMaterialForm
                                    )
                                }
                            >
                                {showMaterialForm
                                    ? "Cancel"
                                    : "+ Add Material"
                                }
                            </button>

                        </div>

                        {showMaterialForm && (

                            <div style={styles.formCard}>

                                <h3>
                                    Upload Material
                                </h3>

                                <form
                                    onSubmit={
                                        uploadMaterial
                                    }
                                >

                                    <label>
                                        Material Title
                                    </label>

                                    <input
                                        style={
                                            styles.input
                                        }
                                        type="text"
                                        placeholder="e.g. Algebra Notes"
                                        value={
                                            material.title
                                        }
                                        onChange={(e) =>
                                            setMaterial({
                                                ...material,
                                                title:
                                                    e.target.value
                                            })
                                        }
                                        required
                                    />

                                    <label>
                                        Description
                                    </label>

                                    <textarea
                                        style={
                                            styles.textarea
                                        }
                                        placeholder="Briefly describe this material..."
                                        value={
                                            material.description
                                        }
                                        onChange={(e) =>
                                            setMaterial({
                                                ...material,
                                                description:
                                                    e.target.value
                                            })
                                        }
                                    />

                                    <label>
                                        File
                                    </label>

                                    <input
                                        type="file"
                                        onChange={(e) =>
                                            setMaterial({
                                                ...material,
                                                file:
                                                    e.target.files[0]
                                            })
                                        }
                                        required
                                    />

                                    <br />
                                    <br />

                                    <button
                                        type="submit"
                                    >
                                        🚀 Upload Material
                                    </button>

                                </form>

                            </div>

                        )}

                        <hr />

                        {materials.length === 0 ? (

                            <div style={styles.emptyCard}>

                                <h3>
                                    📚 No materials uploaded
                                </h3>

                                <p>
                                    Upload your first
                                    learning resource.
                                </p>

                            </div>

                        ) : (

                            materials.map(
                                (item, index) => (

                                    <div
                                        key={
                                            item._id ||
                                            index
                                        }
                                        style={styles.card}
                                    >

                                        <h3>
                                            📄{" "}
                                            {item.title}
                                        </h3>

                                        {item.description && (

                                            <p>
                                                {
                                                    item.description
                                                }
                                            </p>

                                        )}

                                        {item.file && (

                                            <button
                                                onClick={() =>
                                                    window.open(
                                                        `https://tutorhub-api-bz1y.onrender.com/${item.file}`,
                                                        "_blank"
                                                    )
                                                }
                                            >
                                                ⬇️ Open Material
                                            </button>

                                        )}

                                        {" "}

                                        <button
                                            onClick={() =>
                                                deleteMaterial(
                                                    item._id,
                                                    item.title
                                                )
                                            }
                                        >
                                            🗑️ Delete
                                        </button>

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

                        <div style={styles.sectionHeader}>

                            <div>

                                <h2>
                                    📝 Assignments
                                </h2>

                                <p>
                                    Create assessments and
                                    manage learner
                                    submissions.
                                </p>

                            </div>

                            <button
                                onClick={() =>
                                    setShowAssignmentForm(
                                        !showAssignmentForm
                                    )
                                }
                            >
                                {showAssignmentForm
                                    ? "Cancel"
                                    : "+ Create Assignment"
                                }
                            </button>

                        </div>

                        {showAssignmentForm && (

                            <div style={styles.formCard}>

                                <h3>
                                    Create Assignment
                                </h3>

                                <form
                                    onSubmit={
                                        createAssignment
                                    }
                                >

                                    <label>
                                        Assignment Title
                                    </label>

                                    <input
                                        style={
                                            styles.input
                                        }
                                        type="text"
                                        placeholder="e.g. Newton's Laws Test"
                                        value={
                                            assignment.title
                                        }
                                        onChange={(e) =>
                                            setAssignment({
                                                ...assignment,
                                                title:
                                                    e.target.value
                                            })
                                        }
                                        required
                                    />

                                    <label>
                                        Due Date
                                    </label>

                                    <input
                                        style={
                                            styles.input
                                        }
                                        type="date"
                                        value={
                                            assignment.dueDate
                                        }
                                        onChange={(e) =>
                                            setAssignment({
                                                ...assignment,
                                                dueDate:
                                                    e.target.value
                                            })
                                        }
                                        required
                                    />

                                    <label>
                                        Description
                                    </label>

                                    <textarea
                                        style={
                                            styles.textarea
                                        }
                                        placeholder="Describe the assignment..."
                                        value={
                                            assignment.description
                                        }
                                        onChange={(e) =>
                                            setAssignment({
                                                ...assignment,
                                                description:
                                                    e.target.value
                                            })
                                        }
                                    />

                                    <label>
                                        Total Marks
                                    </label>

                                    <input
                                        style={
                                            styles.input
                                        }
                                        type="number"
                                        min="1"
                                        placeholder="Total marks"
                                        value={
                                            assignment.totalMarks
                                        }
                                        onChange={(e) =>
                                            setAssignment({
                                                ...assignment,
                                                totalMarks:
                                                    e.target.value
                                            })
                                        }
                                        required
                                    />

                                    <h3>
                                        Questions
                                    </h3>

                                    <button
                                        type="button"
                                        onClick={
                                            addQuestion
                                        }
                                    >
                                        + Add Question
                                    </button>

                                    {assignment.questions.map(
                                        (
                                            question,
                                            index
                                        ) => (

                                            <div
                                                key={
                                                    index
                                                }
                                                style={
                                                    styles.questionCard
                                                }
                                            >

                                                <h4>
                                                    Question{" "}
                                                    {index + 1}
                                                </h4>

                                                {assignment.questions.length >
                                                    1 && (

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeQuestion(
                                                                index
                                                            )
                                                        }
                                                    >
                                                        🗑 Remove
                                                    </button>

                                                )}

                                                <textarea
                                                    style={
                                                        styles.textarea
                                                    }
                                                    placeholder="Enter question"
                                                    value={
                                                        question.questionText
                                                    }
                                                    onChange={(e) => {

                                                        const updated =
                                                            [
                                                                ...assignment.questions
                                                            ];

                                                        updated[
                                                            index
                                                        ].questionText =
                                                            e.target.value;

                                                        setAssignment({

                                                            ...assignment,

                                                            questions:
                                                                updated

                                                        });

                                                    }}
                                                    required
                                                />

                                                <input
                                                    style={
                                                        styles.input
                                                    }
                                                    type="number"
                                                    min="1"
                                                    placeholder="Question marks"
                                                    value={
                                                        question.marks
                                                    }
                                                    onChange={(e) => {

                                                        const updated =
                                                            [
                                                                ...assignment.questions
                                                            ];

                                                        updated[
                                                            index
                                                        ].marks =
                                                            e.target.value;

                                                        setAssignment({

                                                            ...assignment,

                                                            questions:
                                                                updated

                                                        });

                                                    }}
                                                    required
                                                />

                                            </div>

                                        )
                                    )}

                                    <button
                                        type="submit"
                                    >
                                        🚀 Create Assignment
                                    </button>

                                </form>

                            </div>

                        )}

                        <hr />

                        {assignments.length === 0 ? (

                            <div style={styles.emptyCard}>

                                <h3>
                                    📚 No assignments yet
                                </h3>

                                <p>
                                    Create an assignment
                                    to give your learners
                                    work.
                                </p>

                            </div>

                        ) : (

                            assignments.map(
                                (item) => (

                                    <div
                                        key={
                                            item._id
                                        }
                                        style={styles.card}
                                    >

                                        <h3>
                                            📝{" "}
                                            {item.title}
                                        </h3>

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
                                                Due Date:
                                            </strong>{" "}

                                            {item.dueDate
                                                ? new Date(
                                                    item.dueDate
                                                ).toLocaleDateString()
                                                : "No due date"
                                            }

                                        </p>

                                        <p>

                                            🏆{" "}
                                            <strong>
                                                Total Marks:
                                            </strong>{" "}

                                            {
                                                item.totalMarks
                                            }

                                        </p>

                                        <p>

                                            📝{" "}
                                            {
                                                item.questions?.length ||
                                                0
                                            }{" "}
                                            Questions

                                        </p>

                                        <button
                                            onClick={() =>
                                                navigate(
                                                    `/tutor-submissions/${item._id}`
                                                )
                                            }
                                        >
                                            👥 View Submissions
                                        </button>

                                        {" "}

                                        <button
                                            onClick={() =>
                                                deleteAssignment(
                                                    item._id,
                                                    item.title
                                                )
                                            }
                                        >
                                            🗑 Delete
                                        </button>

                                    </div>

                                )
                            )

                        )}

                    </div>

                )}

                {/* ================================= */}
                {/* LESSONS */}
                {/* ================================= */}

                {activeTab === "lessons" && (

                    <div>

                        <div style={styles.sectionHeader}>

                            <div>

                                <h2>
                                    🎥 Lessons
                                </h2>

                                <p>
                                    Schedule live Jitsi
                                    lessons and manage
                                    your YouTube
                                    recordings.
                                </p>

                            </div>

                            <button
                                onClick={() =>
                                    setShowLessonForm(
                                        !showLessonForm
                                    )
                                }
                            >
                                {showLessonForm
                                    ? "Cancel"
                                    : "+ Create Lesson"
                                }
                            </button>

                        </div>

                        {showLessonForm && (

                            <div style={styles.formCard}>

                                <h3>
                                    Create New Lesson
                                </h3>

                                <form
                                    onSubmit={
                                        createLesson
                                    }
                                >

                                    <label>
                                        Lesson Title
                                    </label>

                                    <input
                                        style={
                                            styles.input
                                        }
                                        type="text"
                                        placeholder="e.g. Newton's Laws"
                                        value={
                                            lesson.title
                                        }
                                        onChange={(e) =>
                                            setLesson({
                                                ...lesson,
                                                title:
                                                    e.target.value
                                            })
                                        }
                                        required
                                    />

                                    <label>
                                        Date
                                    </label>

                                    <input
                                        style={
                                            styles.input
                                        }
                                        type="date"
                                        value={
                                            lesson.date
                                        }
                                        onChange={(e) =>
                                            setLesson({
                                                ...lesson,
                                                date:
                                                    e.target.value
                                            })
                                        }
                                        required
                                    />

                                    <label>
                                        Description
                                    </label>

                                    <textarea
                                        style={
                                            styles.textarea
                                        }
                                        placeholder="Lesson description..."
                                        value={
                                            lesson.description
                                        }
                                        onChange={(e) =>
                                            setLesson({
                                                ...lesson,
                                                description:
                                                    e.target.value
                                            })
                                        }
                                    />

                                    <label>
                                        Start Time
                                    </label>

                                    <input
                                        style={
                                            styles.input
                                        }
                                        type="time"
                                        value={
                                            lesson.time
                                        }
                                        onChange={(e) =>
                                            setLesson({
                                                ...lesson,
                                                time:
                                                    e.target.value
                                            })
                                        }
                                        required
                                    />

                                    <label>
                                        Duration
                                    </label>

                                    <select
                                        style={
                                            styles.input
                                        }
                                        value={
                                            lesson.duration
                                        }
                                        onChange={(e) =>
                                            setLesson({
                                                ...lesson,
                                                duration:
                                                    Number(
                                                        e.target.value
                                                    )
                                            })
                                        }
                                    >

                                        <option value={30}>
                                            30 minutes
                                        </option>

                                        <option value={45}>
                                            45 minutes
                                        </option>

                                        <option value={60}>
                                            1 hour
                                        </option>

                                        <option value={90}>
                                            1 hour 30 minutes
                                        </option>

                                        <option value={120}>
                                            2 hours
                                        </option>

                                        <option value={150}>
                                            2 hours 30 minutes
                                        </option>

                                        <option value={180}>
                                            3 hours
                                        </option>

                                    </select>

                                    <p style={styles.notice}>

                                        💡 As the tutor, you
                                        can enter the Jitsi
                                        room before the
                                        scheduled start time
                                        to set up and wait
                                        for your learners.

                                    </p>

                                    <button
                                        type="submit"
                                    >
                                        🚀 Create Lesson
                                    </button>

                                </form>

                            </div>

                        )}

                        <hr />

                        <div
                            style={
                                styles.lessonFilters
                            }
                        >

                            <button
                                onClick={() =>
                                    setLessonView(
                                        "live"
                                    )
                                }
                            >
                                🟢 Live
                            </button>

                            <button
                                onClick={() =>
                                    setLessonView(
                                        "upcoming"
                                    )
                                }
                            >
                                🟡 Upcoming
                            </button>

                            <button
                                onClick={() =>
                                    setLessonView(
                                        "completed"
                                    )
                                }
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
                                        No lessons are
                                        live right now.
                                    </p>

                                ) : (

                                    liveLessons.map(
                                        (item) => (

                                            <LessonCard
                                                key={
                                                    item._id
                                                }
                                                lesson={
                                                    item
                                                }
                                                type="live"
                                                onDelete={
                                                    deleteLesson
                                                }
                                                onJoin={
                                                    joinLesson
                                                }
                                                onRecording={
                                                    addRecording
                                                }
                                                onWatch={
                                                    watchRecording
                                                }
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
                                        (item) => (

                                            <LessonCard
                                                key={
                                                    item._id
                                                }
                                                lesson={
                                                    item
                                                }
                                                type="upcoming"
                                                onDelete={
                                                    deleteLesson
                                                }
                                                onJoin={
                                                    joinLesson
                                                }
                                                onRecording={
                                                    addRecording
                                                }
                                                onWatch={
                                                    watchRecording
                                                }
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
                                        No completed lessons
                                        yet.
                                    </p>

                                ) : (

                                    completedLessons.map(
                                        (item) => (

                                            <LessonCard
                                                key={
                                                    item._id
                                                }
                                                lesson={
                                                    item
                                                }
                                                type="completed"
                                                onDelete={
                                                    deleteLesson
                                                }
                                                onJoin={
                                                    joinLesson
                                                }
                                                onRecording={
                                                    addRecording
                                                }
                                                onWatch={
                                                    watchRecording
                                                }
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

                            <div style={styles.personCard}>

                                <h3>

                                    {
                                        classroom.tutorId.name
                                    }{" "}

                                    {
                                        classroom.tutorId.surname
                                    }

                                </h3>

                                <p>
                                    Classroom Tutor
                                </p>

                            </div>

                        ) : (

                            <p>
                                Tutor information
                                unavailable.
                            </p>

                        )}

                        <hr />

                        <h3>
                            👥 Learners
                        </h3>

                        {learners.length === 0 ? (

                            <p>
                                No learners have joined
                                this classroom yet.
                            </p>

                        ) : (

                            learners.map(
                                (learner, index) => (

                                    <div
                                        key={
                                            learner._id ||
                                            index
                                        }
                                        style={
                                            styles.personCard
                                        }
                                    >

                                        <h3>

                                            👤{" "}
                                            {
                                                learner.name
                                            }{" "}
                                            {
                                                learner.surname
                                            }

                                        </h3>

                                        <p>
                                            Grade{" "}
                                            {
                                                learner.grade
                                            }
                                        </p>

                                        <p>
                                            🏫{" "}
                                            {
                                                learner.school
                                            }
                                        </p>

                                    </div>

                                )
                            )

                        )}

                    </div>

                )}

                <br />
                <br />

                <BackButton />

            </div>

        </div>

    );
}

// =============================================
// LESSON CARD
// =============================================

function LessonCard({
    lesson,
    type,
    onDelete,
    onJoin,
    onRecording,
    onWatch
}) {

    return (

        <div style={styles.card}>

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

            {type === "upcoming" && (

                <div>

                    <p>

                        🟡{" "}
                        <strong>
                            Upcoming Lesson
                        </strong>

                    </p>

                    <p>

                        👨‍🏫 As the tutor, you can
                        enter the classroom early
                        to set up and wait for
                        learners.

                    </p>

                    {lesson.jitsiRoom && (

                        <button
                            onClick={() =>
                                onJoin(
                                    lesson.jitsiRoom
                                )
                            }
                        >
                            🎥 Enter & Set Up Class
                        </button>

                    )}

                </div>

            )}

            {type === "live" && (

                <div>

                    <p>

                        🟢{" "}
                        <strong>
                            Live Now
                        </strong>

                    </p>

                    {lesson.jitsiRoom && (

                        <button
                            onClick={() =>
                                onJoin(
                                    lesson.jitsiRoom
                                )
                            }
                        >
                            🔴 Join Live Lesson
                        </button>

                    )}

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
                                onWatch(
                                    lesson.recordingLink
                                )
                            }
                        >
                            ▶️ Watch Recording
                        </button>

                    ) : (

                        <div>

                            <p>
                                🎬 Recording Coming Soon
                            </p>

                            <button
                                onClick={() =>
                                    onRecording(
                                        lesson
                                    )
                                }
                            >
                                🎬 Add YouTube Recording
                            </button>

                        </div>

                    )}

                </div>

            )}

            <br />

            <button
                onClick={() =>
                    onDelete(
                        lesson._id,
                        lesson.title
                    )
                }
            >
                🗑 Delete Lesson
            </button>

        </div>

    );
}

// =============================================
// STYLES
// =============================================

const styles = {

    // =========================================
    // PAGE
    // =========================================

    page: {
        minHeight: "100vh",
        padding: "30px 20px",
        boxSizing: "border-box",
        backgroundColor: "#f5f5f5"
    },

    container: {
        maxWidth: "1100px",
        margin: "0 auto"
    },

    // =========================================
    // LOADING
    // =========================================

    loadingCard: {
        border: "1px solid #ddd",
        padding: "30px",
        borderRadius: "12px",
        backgroundColor: "#fff",
        textAlign: "center"
    },

    // =========================================
    // HEADER
    // =========================================

    header: {
        border: "1px solid #ddd",
        padding: "25px",
        marginBottom: "18px",
        borderRadius: "12px",
        backgroundColor: "#fff"
    },

    backButton: {
        border: "none",
        backgroundColor: "transparent",
        cursor: "pointer",
        padding: "0",
        marginBottom: "15px",
        fontSize: "15px",
        fontWeight: "600"
    },

    // =========================================
    // NAVIGATION
    // =========================================

    navigation: {
        display: "flex",
        gap: "10px",
        marginBottom: "25px",
        flexWrap: "wrap",
        border: "1px solid #ddd",
        padding: "10px",
        borderRadius: "12px",
        backgroundColor: "#fff"
    },

    // BLUE TABS
    tab: {
        border: "1px solid #2563eb",
        padding: "10px 15px",
        borderRadius: "8px",
        backgroundColor: "#fff",
        color: "#2563eb",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "600"
    },

    // ACTIVE BLUE TAB
    activeTab: {
        border: "1px solid #2563eb",
        padding: "10px 15px",
        borderRadius: "8px",
        backgroundColor: "#2563eb",
        color: "#fff",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "600"
    },

    // =========================================
    // SECTION
    // =========================================

    sectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "15px",
        marginBottom: "20px"
    },

    // =========================================
    // CARDS
    // =========================================

    card: {
        border: "1px solid #ddd",
        padding: "20px",
        marginBottom: "18px",
        borderRadius: "12px",
        backgroundColor: "#fff"
    },

    emptyCard: {
        border: "1px solid #ddd",
        padding: "30px",
        marginBottom: "18px",
        borderRadius: "12px",
        backgroundColor: "#fff",
        textAlign: "center"
    },

    personCard: {
        border: "1px solid #ddd",
        padding: "20px",
        marginBottom: "18px",
        borderRadius: "12px",
        backgroundColor: "#fff"
    },

    // =========================================
    // FORMS
    // =========================================

    formCard: {
        border: "1px solid #ddd",
        padding: "20px",
        marginBottom: "20px",
        borderRadius: "12px",
        backgroundColor: "#fafafa"
    },

    input: {
        width: "100%",
        boxSizing: "border-box",
        padding: "11px",
        marginTop: "6px",
        marginBottom: "15px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        fontSize: "14px"
    },

    textarea: {
        width: "100%",
        boxSizing: "border-box",
        minHeight: "100px",
        padding: "11px",
        marginTop: "6px",
        marginBottom: "15px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        fontSize: "14px",
        resize: "vertical"
    },

    questionCard: {
        border: "1px solid #ddd",
        padding: "20px",
        marginTop: "15px",
        marginBottom: "15px",
        borderRadius: "12px",
        backgroundColor: "#fff"
    },

    notice: {
        border: "1px solid #ddd",
        padding: "12px",
        borderRadius: "8px",
        backgroundColor: "#f7f7f7",
        fontSize: "14px"
    },

    // =========================================
    // LESSON FILTERS
    // =========================================

    lessonFilters: {
        display: "flex",
        gap: "10px",
        marginBottom: "25px",
        flexWrap: "wrap"
    }

};

export default TutorClassroom;


