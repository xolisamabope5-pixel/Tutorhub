import {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import DashboardBox
    from "../components/DashboardBox";


function OwnerDashboard() {

    const navigate =
        useNavigate();


    const [owner, setOwner] =
        useState(null);


    const [dashboard, setDashboard] =
        useState(null);


    // =========================================
    // TUTORHUB PAYMENT DETAILS
    // =========================================

    const [platformSettings, setPlatformSettings] =
        useState(null);


    const [paymentProof, setPaymentProof] =
        useState(null);


    const [uploadingProof, setUploadingProof] =
        useState(false);


    // =========================================
    // LOAD OWNER
    // =========================================

    useEffect(() => {

        const savedOwner =
            localStorage.getItem(
                "tutor"
            );


        if (!savedOwner) {

            navigate(
                "/tutor-login"
            );

            return;

        }


        const ownerData =
            JSON.parse(
                savedOwner
            );


        // =====================================
        // ONLY OWNER CAN ACCESS THIS PAGE
        // =====================================

        if (
            ownerData.role !==
            "owner"
        ) {

            alert(
                "Access denied"
            );


            navigate(
                "/tutor-dashboard"
            );


            return;

        }


        setOwner(
            ownerData
        );


        fetchDashboard(
            ownerData.id
        );


        fetchPlatformSettings(
            ownerData.id
        );


    }, [navigate]);


    // =========================================
    // FETCH OWNER DASHBOARD
    // =========================================

    const fetchDashboard =
        async (ownerId) => {

            try {

                const response =
                    await fetch(
                        `http://localhost:5000/api/programs/owner/${ownerId}`
                    );


                const data =
                    await response.json();


                if (response.ok) {

                    setDashboard(
                        data
                    );

                } else {

                    alert(
                        data.message
                    );

                }


            } catch (error) {

                console.log(
                    error
                );

            }

        };


    // =========================================
    // FETCH TUTORHUB BANK DETAILS
    // OWNER ONLY
    // =========================================

    const fetchPlatformSettings =
        async (ownerId) => {

            try {

                const response =
                    await fetch(
                        `http://localhost:5000/api/platform-settings/owner/${ownerId}`
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    alert(
                        data.message ||
                        "Could not load TutorHub payment details"
                    );

                    return;

                }


                setPlatformSettings(
                    data
                );


            } catch (error) {

                console.log(
                    "Could not load TutorHub payment details:",
                    error
                );

            }

        };


    // =========================================
    // VIEW PAYMENT PROOF
    // =========================================

    const viewPaymentProof =
        (file) => {

            if (!file) {

                return;

            }


            window.open(

                `http://localhost:5000/uploads/${file}`,

                "_blank"

            );

        };


    // =========================================
    // UPLOAD TUTORHUB PAYMENT PROOF
    // =========================================

    const uploadPaymentProof =
        async () => {

            if (!paymentProof) {

                alert(
                    "Please select a payment proof first."
                );

                return;

            }


            try {

                setUploadingProof(
                    true
                );


                const formData =
                    new FormData();


                formData.append(
                    "paymentProof",
                    paymentProof
                );


                const response =
                    await fetch(
                        `http://localhost:5000/api/platform-settings/owner/${owner.id}/payment-proof`,
                        {

                            method:
                                "POST",

                            body:
                                formData

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    alert(
                        data.message ||
                        "Could not upload payment proof"
                    );

                    return;

                }


                alert(
                    "Payment proof uploaded successfully ✅"
                );


                setPaymentProof(
                    null
                );


                // Reset file input
                const fileInput =
                    document.getElementById(
                        "tutorhubPaymentProof"
                    );


                if (fileInput) {

                    fileInput.value =
                        "";

                }


                // Refresh details
                fetchPlatformSettings(
                    owner.id
                );


            } catch (error) {

                console.log(
                    error
                );


                alert(
                    "Something went wrong while uploading payment proof."
                );


            } finally {

                setUploadingProof(
                    false
                );

            }

        };


    // =========================================
    // APPROVE LEARNER
    // =========================================

    const approveLearner =
        async (id) => {

            try {

                const response =
                    await fetch(

                        `http://localhost:5000/api/learners/${id}/approve`,

                        {
                            method:
                                "PUT"
                        }

                    );


                const data =
                    await response.json();


                if (response.ok) {

                    alert(
                        "Learner approved ✅"
                    );


                    fetchDashboard(
                        owner.id
                    );

                } else {

                    alert(
                        data.message
                    );

                }


            } catch (error) {

                console.log(
                    error
                );

            }

        };


    // =========================================
    // BLOCK LEARNER
    // =========================================

    const blockLearner =
        async (id) => {

            try {

                await fetch(

                    `http://localhost:5000/api/learners/${id}/block`,

                    {
                        method:
                            "PUT"
                    }

                );


                alert(
                    "Learner blocked"
                );


                fetchDashboard(
                    owner.id
                );


            } catch (error) {

                console.log(
                    error
                );

            }

        };


    // =========================================
    // UNBLOCK LEARNER
    // =========================================

    const unblockLearner =
        async (id) => {

            try {

                await fetch(

                    `http://localhost:5000/api/learners/${id}/unblock`,

                    {
                        method:
                            "PUT"
                    }

                );


                alert(
                    "Learner unblocked"
                );


                fetchDashboard(
                    owner.id
                );


            } catch (error) {

                console.log(
                    error
                );

            }

        };


    // =========================================
    // LOGOUT
    // =========================================

    const logout = () => {

        localStorage.removeItem(
            "tutor"
        );


        navigate(
            "/tutor-login"
        );

    };


    // =========================================
    // LOADING
    // =========================================

    if (
        !owner ||
        !dashboard
    ) {

        return (

            <h2>
                Loading Owner Dashboard...
            </h2>

        );

    }


    // =========================================
    // DASHBOARD
    // =========================================

    return (

        <div
            style={{
                padding: "30px",
                maxWidth: "1200px",
                margin: "0 auto"
            }}
        >


            <h1>
                TutorHub Owner Dashboard 🚀
            </h1>


            <h2>
                Welcome{" "}
                {owner.name}{" "}
                {owner.surname}
            </h2>


            <hr />


            {/* =====================================
                PAYMENT DASHBOARD BOXES
            ===================================== */}

            <div
                style={{
                    display: "flex",
                    gap: "20px",
                    flexWrap: "wrap"
                }}
            >


                {/* =================================
                    LEARNER PAYMENTS
                ================================= */}

                <DashboardBox

                    icon="💳"

                    title="Payments"

                    description="Manage learner payments"

                    onClick={() =>
                        navigate(
                            "/owner/payments"
                        )
                    }

                />


                {/* =================================
                    TUTORHUB PAYMENT
                ================================= */}

                <DashboardBox

                    icon="🏦"

                    title="Pay TutorHub"

                    description="Pay your monthly TutorHub subscription"

                    onClick={() =>
                        navigate(
                            "/owner/tutorhub-payment"
                        )
                    }

                />


            </div>


            {/* =====================================
                TUTORHUB SUBSCRIPTION
            ===================================== */}

            <div
                style={{
                    marginTop: "30px",
                    padding: "25px",
                    background: "#ffffff",
                    borderRadius: "16px",
                    border:
                        "1px solid #e5e7eb",
                    boxShadow:
                        "0 5px 20px rgba(0,0,0,0.05)"
                }}
            >

                <p
                    style={{
                        fontSize: "11px",
                        fontWeight: "800",
                        letterSpacing: "1.5px",
                        opacity: 0.55,
                        marginBottom: "5px"
                    }}
                >
                    TUTORHUB SUBSCRIPTION
                </p>


                <h2>
                    🏦 Pay TutorHub
                </h2>


                <p
                    style={{
                        opacity: 0.65
                    }}
                >
                    Pay your TutorHub subscription
                    and upload your proof of payment.
                </p>


                {/* =================================
                    MAIN PAY BUTTON
                ================================= */}

                <button
                    onClick={() =>
                        navigate(
                            "/owner/tutorhub-payment"
                        )
                    }
                    style={{
                        marginTop: "10px",
                        padding: "13px 22px",
                        border: "none",
                        borderRadius: "9px",
                        background: "#111827",
                        color: "#ffffff",
                        cursor: "pointer",
                        fontWeight: "700",
                        fontSize: "15px"
                    }}
                >
                    💳 Pay TutorHub
                </button>


                {!platformSettings ? (

                    <p>
                        Loading TutorHub banking details...
                    </p>

                ) : (

                    <>


                        {/* =================================
                            BANKING DETAILS
                        ================================= */}

                        <div
                            style={{
                                marginTop: "20px",
                                padding: "20px",
                                background: "#f7f8fb",
                                borderRadius: "12px"
                            }}
                        >

                            <h3>
                                TutorHub Banking Details
                            </h3>


                            {!platformSettings.tutorhubBankName ||
                            !platformSettings.tutorhubAccountHolder ||
                            !platformSettings.tutorhubAccountNumber ||
                            !platformSettings.tutorhubBranchCode ? (

                                <p
                                    style={{
                                        color: "#a33a3a",
                                        fontWeight: "700"
                                    }}
                                >
                                    🔴 TutorHub banking details
                                    have not been configured yet.
                                </p>

                            ) : (

                                <div>

                                    <p>
                                        <strong>
                                            Bank:
                                        </strong>{" "}
                                        {
                                            platformSettings
                                                .tutorhubBankName
                                        }
                                    </p>


                                    <p>
                                        <strong>
                                            Account Holder:
                                        </strong>{" "}
                                        {
                                            platformSettings
                                                .tutorhubAccountHolder
                                        }
                                    </p>


                                    <p>
                                        <strong>
                                            Account Number:
                                        </strong>{" "}
                                        {
                                            platformSettings
                                                .tutorhubAccountNumber
                                        }
                                    </p>


                                    <p>
                                        <strong>
                                            Branch Code:
                                        </strong>{" "}
                                        {
                                            platformSettings
                                                .tutorhubBranchCode
                                        }
                                    </p>


                                    <p>
                                        <strong>
                                            Monthly Subscription:
                                        </strong>{" "}
                                        {
                                            platformSettings.currency ||
                                            "ZAR"
                                        }{" "}
                                        {
                                            Number(
                                                platformSettings
                                                    .monthlySubscription ||
                                                0
                                            ).toFixed(2)
                                        }
                                    </p>

                                </div>

                            )}

                        </div>


                        {/* =================================
                            PAYMENT PROOF
                        ================================= */}

                        <div
                            style={{
                                marginTop: "20px",
                                padding: "20px",
                                border:
                                    "1px solid #e5e7eb",
                                borderRadius: "12px"
                            }}
                        >

                            <h3>
                                📄 Upload Payment Proof
                            </h3>


                            <p
                                style={{
                                    fontSize: "13px",
                                    opacity: 0.65
                                }}
                            >
                                After paying TutorHub,
                                upload your proof of payment.
                            </p>


                            <input
                                id="tutorhubPaymentProof"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) =>
                                    setPaymentProof(
                                        e.target.files[0]
                                    )
                                }
                            />


                            <br />
                            <br />


                            <button
                                onClick={
                                    uploadPaymentProof
                                }
                                disabled={
                                    uploadingProof ||
                                    !paymentProof
                                }
                                style={{
                                    padding:
                                        "11px 18px",
                                    border: "none",
                                    borderRadius:
                                        "9px",
                                    background:
                                        uploadingProof ||
                                        !paymentProof
                                            ? "#9ca3af"
                                            : "#111827",
                                    color:
                                        "#ffffff",
                                    cursor:
                                        uploadingProof ||
                                        !paymentProof
                                            ? "not-allowed"
                                            : "pointer",
                                    fontWeight:
                                        "700"
                                }}
                            >
                                {
                                    uploadingProof
                                        ? "Uploading..."
                                        : "📤 Upload Proof"
                                }
                            </button>


                            {/* =================================
                                EXISTING PROOF
                            ================================= */}

                            {platformSettings
                                .tutorhubPaymentProof && (

                                <div
                                    style={{
                                        marginTop:
                                            "20px",
                                        padding:
                                            "15px",
                                        background:
                                            "#e8f8ee",
                                        borderRadius:
                                            "10px"
                                    }}
                                >

                                    <strong>
                                        ✅ Payment proof
                                        uploaded
                                    </strong>


                                    <br />
                                    <br />


                                    <button
                                        onClick={() =>
                                            viewPaymentProof(
                                                platformSettings
                                                    .tutorhubPaymentProof
                                            )
                                        }
                                        style={{
                                            padding:
                                                "9px 14px",
                                            border:
                                                "1px solid #d1d5db",
                                            background:
                                                "#ffffff",
                                            borderRadius:
                                                "8px",
                                            cursor:
                                                "pointer",
                                            fontWeight:
                                                "700"
                                        }}
                                    >
                                        📄 View Uploaded Proof
                                    </button>

                                </div>

                            )}

                        </div>

                    </>

                )}

            </div>


            <hr
                style={{
                    margin:
                        "35px 0"
                }}
            />


            {/* =====================================
                MY TUITION CENTRE
            ===================================== */}

            <h2>
                My Tuition Centre 🏫
            </h2>


            <h3>
                {
                    dashboard.program.name
                }
            </h3>


            <p>
                Status:{" "}
                {
                    dashboard.program.status
                }
            </p>


            <p>
                Subscription:{" "}
                {
                    dashboard.program.subscriptionStatus
                }
            </p>


            <hr />


            {/* =====================================
                TEACHERS
            ===================================== */}

            <h2>
                Teachers 👨‍🏫
            </h2>


            {
                dashboard.tutors.length ===
                0 ? (

                    <p>
                        No teachers yet.
                    </p>

                ) : (

                    dashboard.tutors.map(
                        (teacher) => (

                            <div
                                key={
                                    teacher._id
                                }
                            >

                                <h3>
                                    {
                                        teacher.name
                                    }{" "}
                                    {
                                        teacher.surname
                                    }
                                </h3>


                                <p>
                                    Subjects:{" "}
                                    {
                                        teacher.subjects
                                    }
                                </p>


                                <p>
                                    Role:{" "}
                                    {
                                        teacher.role
                                    }
                                </p>


                                <p>
                                    Status:{" "}
                                    {
                                        teacher.status
                                    }
                                </p>


                                <button
                                    onClick={() =>
                                        navigate(
                                            `/manage-teacher/${teacher._id}`
                                        )
                                    }
                                >
                                    Manage Teacher 👨‍🏫
                                </button>


                                <hr />

                            </div>

                        )
                    )

                )
            }


            {/* =====================================
                LEARNERS
            ===================================== */}

            <h2>
                Learners 📚
            </h2>


            {
                dashboard.learners.length ===
                0 ? (

                    <p>
                        No learners yet.
                    </p>

                ) : (

                    dashboard.learners.map(
                        (learner) => (

                            <div
                                key={
                                    learner._id
                                }
                            >

                                <h3>
                                    {
                                        learner.name
                                    }{" "}
                                    {
                                        learner.surname
                                    }
                                </h3>


                                <p>
                                    Grade:{" "}
                                    {
                                        learner.grade
                                    }
                                </p>


                                <p>
                                    Status:{" "}
                                    {
                                        learner.status
                                    }
                                </p>


                                <p>
                                    Account:{" "}
                                    {
                                        learner.accountStatus
                                    }
                                </p>


                                {
                                    learner.status ===
                                    "Pending" && (

                                        <button
                                            onClick={() =>
                                                approveLearner(
                                                    learner._id
                                                )
                                            }
                                        >
                                            Approve Learner ✅
                                        </button>

                                    )
                                }


                                {
                                    learner.paymentProof && (

                                        <button
                                            onClick={() =>
                                                viewPaymentProof(
                                                    learner.paymentProof
                                                )
                                            }
                                        >
                                            View Payment Proof 📄
                                        </button>

                                    )
                                }


                                {
                                    learner.accountStatus ===
                                    "Blocked" ? (

                                        <button
                                            onClick={() =>
                                                unblockLearner(
                                                    learner._id
                                                )
                                            }
                                        >
                                            Unblock Learner
                                        </button>

                                    ) : (

                                        <button
                                            onClick={() =>
                                                blockLearner(
                                                    learner._id
                                                )
                                            }
                                        >
                                            Block Learner
                                        </button>

                                    )
                                }


                                <hr />

                            </div>

                        )
                    )

                )
            }


            {/* =====================================
                LOGOUT
            ===================================== */}

            <button
                onClick={
                    logout
                }
            >
                Logout
            </button>


        </div>

    );

}


export default OwnerDashboard;