import {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import BackButton
    from "../../components/BackButton";


function OwnerTutorHubPayment() {


    const navigate =
        useNavigate();


    // =========================================
    // OWNER
    // =========================================

    const [owner, setOwner] =
        useState(null);


    // =========================================
    // PROGRAM
    // =========================================

    const [program, setProgram] =
        useState(null);


    // =========================================
    // TUTORHUB SETTINGS
    // =========================================

    const [platformSettings, setPlatformSettings] =
        useState(null);


    const [loadingSettings, setLoadingSettings] =
        useState(true);


    // =========================================
    // PAYMENTS
    // =========================================

    const [payments, setPayments] =
        useState([]);


    // =========================================
    // PAYMENT FORM
    // =========================================

    const [selectedFile, setSelectedFile] =
        useState(null);


    const [showCreate, setShowCreate] =
        useState(false);


    const [newPayment, setNewPayment] =
        useState({

            month: "",

            year: "",

            amount: ""

        });


    const [submitting, setSubmitting] =
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


        try {

            const ownerData =
                JSON.parse(
                    savedOwner
                );


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


            loadOwnerData(
                ownerData.id
            );


        } catch (error) {

            console.log(
                "Could not read saved owner:",
                error
            );


            localStorage.removeItem(
                "tutor"
            );


            navigate(
                "/tutor-login"
            );

        }


    }, [navigate]);


    // =========================================
    // LOAD OWNER DATA
    // =========================================

    const loadOwnerData =
        async (ownerId) => {


            try {


                // =================================
                // OWNER DASHBOARD / PROGRAM
                // =================================

                const dashboardResponse =
                    await fetch(

                        `https://tutorhub-api-bz1y.onrender.com/api/programs/owner/${ownerId}`

                    );


                const dashboardData =
                    await dashboardResponse.json();


                if (
                    dashboardResponse.ok
                ) {

                    setProgram(
                        dashboardData.program
                    );

                } else {

                    console.log(
                        "Could not load program:",
                        dashboardData.message
                    );

                }


                // =================================
                // TUTORHUB BANK DETAILS
                // =================================
                //
                // IMPORTANT:
                // TutorHub banking details are GLOBAL
                // platform settings.
                //
                // DO NOT use:
                //
                // /api/platform-settings/owner/:ownerId
                //
                // Use:
                //
                // /api/platform-settings
                //
                // =================================

                await fetchPlatformSettings();


                // =================================
                // OWNER PAYMENTS
                // =================================

                await fetchPayments(
                    ownerId
                );


            } catch (error) {


                console.log(
                    "Could not load TutorHub payment page:",
                    error
                );


            }

        };


    // =========================================
    // FETCH PLATFORM SETTINGS
    // =========================================

    const fetchPlatformSettings =
        async () => {


            try {

                setLoadingSettings(
                    true
                );


                const response =
                    await fetch(

                        "https://tutorhub-api-bz1y.onrender.com/api/platform-settings"

                    );


                const data =
                    await response.json();


                if (
                    !response.ok
                ) {

                    console.log(
                        "Could not fetch platform settings:",
                        data.message
                    );


                    setPlatformSettings(
                        null
                    );


                    return;

                }


                console.log(
                    "TutorHub platform settings:",
                    data
                );


                setPlatformSettings(
                    data
                );


            } catch (error) {


                console.log(
                    "Could not fetch TutorHub banking details:",
                    error
                );


                setPlatformSettings(
                    null
                );


            } finally {

                setLoadingSettings(
                    false
                );

            }

        };


    // =========================================
    // FETCH OWNER PAYMENTS
    // =========================================

    const fetchPayments =
        async (ownerId) => {


            try {


                const response =
                    await fetch(

                        `https://tutorhub-api-bz1y.onrender.com/api/owner-payments/owner/${ownerId}`

                    );


                const data =
                    await response.json();


                if (
                    response.ok
                ) {

                    setPayments(
                        data
                    );

                } else {

                    console.log(
                        data.message
                    );

                }


            } catch (error) {


                console.log(
                    "Could not fetch owner payments:",
                    error
                );


            }

        };


    // =========================================
    // HANDLE FORM CHANGE
    // =========================================

    const handlePaymentChange =
        (e) => {


            setNewPayment({

                ...newPayment,

                [e.target.name]:
                    e.target.value

            });


        };


    // =========================================
    // SUBMIT TUTORHUB PAYMENT
    // =========================================

    const submitPayment =
        async (e) => {


            e.preventDefault();


            if (
                !newPayment.month ||
                !newPayment.year ||
                !newPayment.amount ||
                !selectedFile
            ) {

                alert(
                    "Please complete all payment details."
                );

                return;

            }


            if (!program) {

                alert(
                    "Your tuition centre could not be found."
                );

                return;

            }


            try {


                setSubmitting(
                    true
                );


                const form =
                    new FormData();


                form.append(
                    "ownerId",
                    owner.id
                );


                form.append(
                    "programId",
                    program._id
                );


                form.append(
                    "month",
                    newPayment.month
                );


                form.append(
                    "year",
                    newPayment.year
                );


                form.append(
                    "amount",
                    newPayment.amount
                );


                form.append(
                    "proof",
                    selectedFile
                );


                const response =
                    await fetch(

                        "https://tutorhub-api-bz1y.onrender.com/api/owner-payments/create",

                        {

                            method:
                                "POST",

                            body:
                                form

                        }

                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    alert(
                        data.message ||
                        "Could not submit payment."
                    );

                    return;

                }


                alert(
                    "TutorHub payment submitted successfully 🚀"
                );


                setNewPayment({

                    month: "",

                    year: "",

                    amount: ""

                });


                setSelectedFile(
                    null
                );


                const fileInput =
                    document.getElementById(
                        "tutorhubPaymentProof"
                    );


                if (fileInput) {

                    fileInput.value =
                        "";

                }


                setShowCreate(
                    false
                );


                await fetchPayments(
                    owner.id
                );


            } catch (error) {


                console.log(
                    error
                );


                alert(
                    "Could not submit TutorHub payment."
                );


            } finally {


                setSubmitting(
                    false
                );


            }

        };


    // =========================================
    // VIEW PAYMENT PROOF
    // =========================================

    const viewProof =
        (file) => {


            if (!file) {

                alert(
                    "No payment proof available."
                );

                return;

            }


            window.open(

                `https://tutorhub-api-bz1y.onrender.com/uploads/${file}`,

                "_blank"

            );

        };


    // =========================================
    // LOADING OWNER
    // =========================================

    if (!owner) {


        return (

            <div
                style={{
                    padding: "30px"
                }}
            >

                <h2>
                    Loading TutorHub Payment...
                </h2>

            </div>

        );

    }


    // =========================================
    // PAGE
    // =========================================

    return (


        <div

            style={{

                padding: "30px",

                maxWidth: "1000px",

                margin: "0 auto",

                background: "#f5f7fb",

                minHeight: "100vh"

            }}

        >


            {/* =====================================
                HEADER
            ===================================== */}

            <h1>
                Pay TutorHub 🏦
            </h1>


            <p
                style={{
                    opacity: 0.65
                }}
            >
                Pay your monthly TutorHub
                subscription and submit your
                proof of payment.
            </p>


            {/* =====================================
                TUITION CENTRE
            ===================================== */}

            {program && (

                <div

                    style={{

                        marginTop: "20px",

                        padding: "20px",

                        background: "#ffffff",

                        borderRadius: "12px",

                        border:
                            "1px solid #e5e7eb"

                    }}

                >

                    <h2>
                        🏫 {program.name}
                    </h2>


                    <p>

                        Subscription Status:{" "}

                        <strong>
                            {
                                program.subscriptionStatus ||
                                "Pending"
                            }
                        </strong>

                    </p>

                </div>

            )}


            {/* =====================================
                TUTORHUB BANKING DETAILS
            ===================================== */}

            <div

                style={{

                    marginTop: "25px",

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

                        opacity: 0.55

                    }}

                >
                    TUTORHUB PAYMENT DETAILS
                </p>


                <h2>
                    🏦 TutorHub Banking Details
                </h2>


                {/* =================================
                    LOADING
                ================================= */}

                {loadingSettings && (

                    <div
                        style={{
                            padding: "15px 0"
                        }}
                    >

                        <p>
                            Loading banking details...
                        </p>

                    </div>

                )}


                {/* =================================
                    SETTINGS FAILED
                ================================= */}

                {!loadingSettings &&
                    !platformSettings && (

                    <div

                        style={{

                            padding: "15px",

                            background: "#fff7ed",

                            borderRadius: "10px",

                            border:
                                "1px solid #fed7aa"

                        }}

                    >

                        <strong>
                            ⚠️ Banking details could not
                            be loaded.
                        </strong>


                        <p
                            style={{
                                marginBottom: 0,
                                opacity: 0.7
                            }}
                        >
                            Please try refreshing the
                            page. If the problem continues,
                            contact TutorHub support.
                        </p>

                    </div>

                )}


                {/* =================================
                    BANK DETAILS
                ================================= */}

                {!loadingSettings &&
                    platformSettings && (

                    <div>

                        <div
                            style={styles.bankGrid}
                        >


                            {/* BANK */}

                            <div
                                style={styles.bankItem}
                            >

                                <span
                                    style={
                                        styles.bankLabel
                                    }
                                >
                                    BANK NAME
                                </span>

                                <strong
                                    style={
                                        styles.bankValue
                                    }
                                >

                                    {
                                        platformSettings
                                            .tutorhubBankName ||
                                        "Not configured"
                                    }

                                </strong>

                            </div>


                            {/* ACCOUNT HOLDER */}

                            <div
                                style={styles.bankItem}
                            >

                                <span
                                    style={
                                        styles.bankLabel
                                    }
                                >
                                    ACCOUNT HOLDER
                                </span>

                                <strong
                                    style={
                                        styles.bankValue
                                    }
                                >

                                    {
                                        platformSettings
                                            .tutorhubAccountHolder ||
                                        "Not configured"
                                    }

                                </strong>

                            </div>


                            {/* ACCOUNT NUMBER */}

                            <div
                                style={styles.bankItem}
                            >

                                <span
                                    style={
                                        styles.bankLabel
                                    }
                                >
                                    ACCOUNT NUMBER
                                </span>

                                <strong
                                    style={
                                        styles.bankValue
                                    }
                                >

                                    {
                                        platformSettings
                                            .tutorhubAccountNumber ||
                                        "Not configured"
                                    }

                                </strong>

                            </div>


                            {/* BRANCH CODE */}

                            <div
                                style={styles.bankItem}
                            >

                                <span
                                    style={
                                        styles.bankLabel
                                    }
                                >
                                    BRANCH CODE
                                </span>

                                <strong
                                    style={
                                        styles.bankValue
                                    }
                                >

                                    {
                                        platformSettings
                                            .tutorhubBranchCode ||
                                        "Not configured"
                                    }

                                </strong>

                            </div>


                        </div>


                        {/* =================================
                            MONTHLY SUBSCRIPTION
                        ================================= */}

                        <div
                            style={
                                styles.subscriptionBox
                            }
                        >

                            <span>
                                Monthly TutorHub Subscription
                            </span>


                            <strong>

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

                            </strong>

                        </div>


                        {/* =================================
                            PAYMENT INSTRUCTION
                        ================================= */}

                        <div
                            style={
                                styles.instructionBox
                            }
                        >

                            💡 Please use your tuition
                            centre name as the payment
                            reference when making the
                            bank transfer.

                        </div>

                    </div>

                )}

            </div>


            {/* =====================================
                CREATE PAYMENT BUTTON
            ===================================== */}

            <button

                onClick={() =>
                    setShowCreate(
                        !showCreate
                    )
                }

                style={styles.createButton}

            >

                {

                    showCreate

                        ? "Close Payment Form ❌"

                        : "Create TutorHub Payment ➕"

                }

            </button>


            {/* =====================================
                PAYMENT FORM
            ===================================== */}

            {showCreate && (


                <div
                    style={
                        styles.formCard
                    }
                >


                    <h2>
                        Create TutorHub Payment 💳
                    </h2>


                    <form
                        onSubmit={
                            submitPayment
                        }
                    >


                        <select

                            name="month"

                            value={
                                newPayment.month
                            }

                            onChange={
                                handlePaymentChange
                            }

                            style={
                                styles.formInput
                            }

                        >

                            <option value="">
                                Choose Month
                            </option>

                            <option value="January">
                                January
                            </option>

                            <option value="February">
                                February
                            </option>

                            <option value="March">
                                March
                            </option>

                            <option value="April">
                                April
                            </option>

                            <option value="May">
                                May
                            </option>

                            <option value="June">
                                June
                            </option>

                            <option value="July">
                                July
                            </option>

                            <option value="August">
                                August
                            </option>

                            <option value="September">
                                September
                            </option>

                            <option value="October">
                                October
                            </option>

                            <option value="November">
                                November
                            </option>

                            <option value="December">
                                December
                            </option>

                        </select>


                        <br />
                        <br />


                        <input

                            type="number"

                            name="year"

                            placeholder="Year"

                            value={
                                newPayment.year
                            }

                            onChange={
                                handlePaymentChange
                            }

                            style={
                                styles.formInput
                            }

                        />


                        <br />
                        <br />


                        <input

                            type="number"

                            name="amount"

                            placeholder="Amount"

                            value={
                                newPayment.amount
                            }

                            onChange={
                                handlePaymentChange
                            }

                            style={
                                styles.formInput
                            }

                        />


                        <br />
                        <br />


                        <input

                            id="tutorhubPaymentProof"

                            type="file"

                            accept=".pdf,.jpg,.jpeg,.png"

                            onChange={(e) =>
                                setSelectedFile(
                                    e.target.files[0]
                                )
                            }

                        />


                        <br />
                        <br />


                        <button

                            type="submit"

                            disabled={
                                submitting
                            }

                            style={{

                                ...styles.submitButton,

                                background:
                                    submitting
                                        ? "#9ca3af"
                                        : "#111827",

                                cursor:
                                    submitting
                                        ? "not-allowed"
                                        : "pointer"

                            }}

                        >

                            {

                                submitting

                                    ? "Submitting..."

                                    : "Submit Payment 📤"

                            }

                        </button>


                    </form>


                </div>

            )}


            {/* =====================================
                PAYMENT HISTORY
            ===================================== */}

            <div
                style={{
                    marginTop: "35px"
                }}
            >

                <h2>
                    TutorHub Payment History 💳
                </h2>


                {

                    payments.length === 0 ? (


                        <p>
                            No TutorHub payment history yet.
                        </p>


                    ) : (


                        payments.map(
                            (payment) => (


                                <div

                                    key={
                                        payment._id
                                    }

                                    style={
                                        styles.paymentCard
                                    }

                                >

                                    <h3>

                                        {
                                            payment.month
                                        }{" "}

                                        {
                                            payment.year
                                        }

                                    </h3>


                                    <p>

                                        <strong>
                                            Amount:
                                        </strong>{" "}

                                        R
                                        {
                                            Number(
                                                payment.amount
                                            ).toFixed(2)
                                        }

                                    </p>


                                    <p>

                                        <strong>
                                            Status:
                                        </strong>{" "}

                                        <span
                                            style={{
                                                fontWeight:
                                                    "700"
                                            }}
                                        >
                                            {
                                                payment.status
                                            }
                                        </span>

                                    </p>


                                    {

                                        payment.proof && (


                                            <button

                                                onClick={() =>
                                                    viewProof(
                                                        payment.proof
                                                    )
                                                }

                                                style={
                                                    styles.proofButton
                                                }

                                            >

                                                View Proof 📄

                                            </button>


                                        )

                                    }


                                </div>


                            )

                        )


                    )

                }

            </div>


            <div
                style={{
                    marginTop: "30px"
                }}
            >

                <BackButton />

            </div>


        </div>

    );

}


// =====================================================
// STYLES
// =====================================================

const styles = {


    bankGrid: {

        display: "grid",

        gridTemplateColumns:
            "1fr 1fr",

        gap: "12px",

        marginTop: "20px"

    },


    bankItem: {

        padding: "16px",

        background: "#f7f8fb",

        borderRadius: "11px",

        border:
            "1px solid #e5e7eb",

        display: "flex",

        flexDirection: "column",

        gap: "6px"

    },


    bankLabel: {

        fontSize: "10px",

        fontWeight: "800",

        letterSpacing: "0.7px",

        opacity: 0.5

    },


    bankValue: {

        fontSize: "15px",

        color: "#111827"

    },


    subscriptionBox: {

        marginTop: "15px",

        padding: "15px 17px",

        background: "#eef2ff",

        borderRadius: "11px",

        display: "flex",

        justifyContent: "space-between",

        alignItems: "center",

        gap: "15px",

        fontSize: "14px"

    },


    instructionBox: {

        marginTop: "12px",

        padding: "13px 15px",

        background: "#f0fdf4",

        border:
            "1px solid #bbf7d0",

        borderRadius: "10px",

        fontSize: "13px",

        lineHeight: "1.5"

    },


    createButton: {

        marginTop: "25px",

        padding: "13px 20px",

        border: "none",

        borderRadius: "9px",

        background: "#111827",

        color: "#ffffff",

        cursor: "pointer",

        fontWeight: "700",

        fontSize: "15px"

    },


    formCard: {

        marginTop: "20px",

        padding: "25px",

        border:
            "1px solid #e5e7eb",

        borderRadius: "14px",

        background: "#ffffff"

    },


    formInput: {

        padding: "10px",

        width: "100%",

        maxWidth: "400px",

        boxSizing: "border-box",

        border:
            "1px solid #d1d5db",

        borderRadius: "8px"

    },


    submitButton: {

        padding:
            "12px 20px",

        border: "none",

        borderRadius:
            "9px",

        color:
            "#ffffff",

        fontWeight:
            "700"

    },


    paymentCard: {

        border:
            "1px solid #e5e7eb",

        padding: "20px",

        marginTop: "15px",

        borderRadius:
            "12px",

        background:
            "#ffffff"

    },


    proofButton: {

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

    }

};


export default OwnerTutorHubPayment;
