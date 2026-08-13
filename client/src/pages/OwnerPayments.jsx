import {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";


function OwnerPayments() {

    const navigate =
        useNavigate();


    const [owner, setOwner] =
        useState(null);


    const [program, setProgram] =
        useState(null);


    const [payments, setPayments] =
        useState([]);


    const [month, setMonth] =
        useState("");


    const [year, setYear] =
        useState(
            new Date().getFullYear()
        );


    const [amount, setAmount] =
        useState("");


    const [proof, setProof] =
        useState(null);


    const [loading, setLoading] =
        useState(true);


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


    }, [navigate]);


    // =========================================
    // LOAD OWNER PROGRAM + PAYMENTS
    // =========================================

    const loadOwnerData =
        async (ownerId) => {

            try {

                setLoading(
                    true
                );


                // =================================
                // GET OWNER PROGRAM
                // =================================

                const programResponse =
                    await fetch(

                        `http://localhost:5000/api/programs/owner/${ownerId}`

                    );


                const programData =
                    await programResponse.json();


                if (
                    !programResponse.ok
                ) {

                    alert(
                        programData.message ||
                        "Could not load tuition centre"
                    );

                    return;

                }


                setProgram(
                    programData.program
                );


                // =================================
                // GET OWNER PAYMENTS
                // =================================

                const paymentsResponse =
                    await fetch(

                        `http://localhost:5000/api/owner-payments/owner/${ownerId}`

                    );


                const paymentsData =
                    await paymentsResponse.json();


                if (
                    paymentsResponse.ok
                ) {

                    setPayments(
                        paymentsData
                    );

                } else {

                    alert(
                        paymentsData.message ||
                        "Could not load payments"
                    );

                }


            } catch (error) {

                console.log(
                    "Owner payment loading error:",
                    error
                );


                alert(
                    "Could not load payment information."
                );


            } finally {

                setLoading(
                    false
                );

            }

        };


    // =========================================
    // CREATE OWNER PAYMENT
    // =========================================

    const submitPayment =
        async (e) => {

            e.preventDefault();


            if (!owner) {

                return;

            }


            if (!program) {

                alert(
                    "Tuition centre information is missing."
                );

                return;

            }


            if (!month) {

                alert(
                    "Please select a payment month."
                );

                return;

            }


            if (!year) {

                alert(
                    "Please enter the payment year."
                );

                return;

            }


            if (
                !amount ||
                Number(amount) <= 0
            ) {

                alert(
                    "Please enter a valid payment amount."
                );

                return;

            }


            if (!proof) {

                alert(
                    "Please upload your payment proof."
                );

                return;

            }


            try {

                setSubmitting(
                    true
                );


                const formData =
                    new FormData();


                formData.append(
                    "ownerId",
                    owner.id
                );


                formData.append(
                    "programId",
                    program._id
                );


                formData.append(
                    "month",
                    month
                );


                formData.append(
                    "year",
                    year
                );


                formData.append(
                    "amount",
                    amount
                );


                formData.append(
                    "proof",
                    proof
                );


                const response =
                    await fetch(

                        "http://localhost:5000/api/owner-payments/create",

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
                        "Could not submit payment."
                    );

                    return;

                }


                alert(
                    "TutorHub payment submitted successfully 🚀"
                );


                // =================================
                // CLEAR FORM
                // =================================

                setMonth(
                    ""
                );


                setYear(
                    new Date().getFullYear()
                );


                setAmount(
                    ""
                );


                setProof(
                    null
                );


                const fileInput =
                    document.getElementById(
                        "ownerPaymentProof"
                    );


                if (fileInput) {

                    fileInput.value =
                        "";

                }


                // =================================
                // REFRESH PAYMENTS
                // =================================

                loadOwnerData(
                    owner.id
                );


            } catch (error) {

                console.log(
                    "Submit owner payment error:",
                    error
                );


                alert(
                    "Something went wrong while submitting the payment."
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

                return;

            }


            window.open(

                `http://localhost:5000/uploads/${file}`,

                "_blank"

            );

        };


    // =========================================
    // LOADING
    // =========================================

    if (
        loading
    ) {

        return (

            <div
                style={{
                    padding: "30px"
                }}
            >

                <h2>
                    Loading TutorHub payments...
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
                margin: "0 auto"
            }}
        >


            {/* =====================================
                HEADER
            ===================================== */}

            <button
                onClick={() =>
                    navigate(
                        "/owner-dashboard"
                    )
                }
                style={{
                    padding: "9px 15px",
                    marginBottom: "20px",
                    border:
                        "1px solid #d1d5db",
                    background:
                        "#ffffff",
                    borderRadius: "8px",
                    cursor: "pointer"
                }}
            >
                ← Back to Dashboard
            </button>


            <h1>
                TutorHub Payments 💳
            </h1>


            <p
                style={{
                    opacity: 0.65
                }}
            >
                Pay your TutorHub subscription
                and upload your proof of payment.
            </p>


            {/* =====================================
                TUITION CENTRE
            ===================================== */}

            {program && (

                <div
                    style={{
                        padding: "20px",
                        marginTop: "20px",
                        background: "#f7f8fb",
                        borderRadius: "12px"
                    }}
                >

                    <h2>
                        🏫{" "}
                        {program.name}
                    </h2>


                    <p>
                        Subscription Status:{" "}
                        <strong>
                            {
                                program.subscriptionStatus
                            }
                        </strong>
                    </p>

                </div>

            )}


            {/* =====================================
                PAYMENT FORM
            ===================================== */}

            <div
                style={{
                    marginTop: "25px",
                    padding: "25px",
                    background: "#ffffff",
                    border:
                        "1px solid #e5e7eb",
                    borderRadius: "16px",
                    boxShadow:
                        "0 5px 20px rgba(0,0,0,0.05)"
                }}
            >

                <h2>
                    💳 Make TutorHub Payment
                </h2>


                <form
                    onSubmit={
                        submitPayment
                    }
                >


                    {/* =================================
                        MONTH
                    ================================= */}

                    <div
                        style={{
                            marginTop: "20px"
                        }}
                    >

                        <label>
                            <strong>
                                Payment Month
                            </strong>
                        </label>


                        <br />


                        <select
                            value={
                                month
                            }
                            onChange={(e) =>
                                setMonth(
                                    e.target.value
                                )
                            }
                            style={{
                                marginTop:
                                    "8px",
                                padding:
                                    "11px",
                                width:
                                    "100%",
                                maxWidth:
                                    "400px",
                                border:
                                    "1px solid #d1d5db",
                                borderRadius:
                                    "8px"
                            }}
                        >

                            <option value="">
                                Select Month
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

                    </div>


                    {/* =================================
                        YEAR
                    ================================= */}

                    <div
                        style={{
                            marginTop: "20px"
                        }}
                    >

                        <label>
                            <strong>
                                Payment Year
                            </strong>
                        </label>


                        <br />


                        <input
                            type="number"
                            value={
                                year
                            }
                            onChange={(e) =>
                                setYear(
                                    e.target.value
                                )
                            }
                            style={{
                                marginTop:
                                    "8px",
                                padding:
                                    "11px",
                                width:
                                    "100%",
                                maxWidth:
                                    "400px",
                                border:
                                    "1px solid #d1d5db",
                                borderRadius:
                                    "8px"
                            }}
                        />

                    </div>


                    {/* =================================
                        AMOUNT
                    ================================= */}

                    <div
                        style={{
                            marginTop: "20px"
                        }}
                    >

                        <label>
                            <strong>
                                Amount Paid
                            </strong>
                        </label>


                        <br />


                        <input
                            type="number"
                            min="1"
                            step="0.01"
                            value={
                                amount
                            }
                            onChange={(e) =>
                                setAmount(
                                    e.target.value
                                )
                            }
                            placeholder="Enter amount"
                            style={{
                                marginTop:
                                    "8px",
                                padding:
                                    "11px",
                                width:
                                    "100%",
                                maxWidth:
                                    "400px",
                                border:
                                    "1px solid #d1d5db",
                                borderRadius:
                                    "8px"
                            }}
                        />

                    </div>


                    {/* =================================
                        PROOF
                    ================================= */}

                    <div
                        style={{
                            marginTop: "20px"
                        }}
                    >

                        <label>
                            <strong>
                                Payment Proof
                            </strong>
                        </label>


                        <br />


                        <input
                            id="ownerPaymentProof"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) =>
                                setProof(
                                    e.target.files[0]
                                )
                            }
                            style={{
                                marginTop:
                                    "10px"
                            }}
                        />


                        <p
                            style={{
                                fontSize: "12px",
                                opacity: 0.6
                            }}
                        >
                            PDF, JPG or PNG.
                            Maximum 5MB.
                        </p>

                    </div>


                    {/* =================================
                        SUBMIT
                    ================================= */}

                    <button
                        type="submit"
                        disabled={
                            submitting
                        }
                        style={{
                            marginTop:
                                "20px",
                            padding:
                                "12px 22px",
                            border:
                                "none",
                            borderRadius:
                                "9px",
                            background:
                                submitting
                                    ? "#9ca3af"
                                    : "#111827",
                            color:
                                "#ffffff",
                            cursor:
                                submitting
                                    ? "not-allowed"
                                    : "pointer",
                            fontWeight:
                                "700"
                        }}
                    >

                        {
                            submitting
                                ? "Submitting..."
                                : "💳 Submit Payment"
                        }

                    </button>


                </form>

            </div>


            {/* =====================================
                PAYMENT HISTORY
            ===================================== */}

            <div
                style={{
                    marginTop: "30px"
                }}
            >

                <h2>
                    Payment History 📋
                </h2>


                {
                    payments.length === 0 ? (

                        <p>
                            No TutorHub payments
                            submitted yet.
                        </p>

                    ) : (

                        payments.map(
                            (payment) => (

                                <div
                                    key={
                                        payment._id
                                    }
                                    style={{
                                        marginTop:
                                            "15px",
                                        padding:
                                            "20px",
                                        background:
                                            "#ffffff",
                                        border:
                                            "1px solid #e5e7eb",
                                        borderRadius:
                                            "12px"
                                    }}
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
                                        Amount:{" "}
                                        <strong>
                                            R{" "}
                                            {
                                                Number(
                                                    payment.amount
                                                ).toFixed(2)
                                            }
                                        </strong>
                                    </p>


                                    <p>
                                        Status:{" "}
                                        <strong>
                                            {
                                                payment.status
                                            }
                                        </strong>
                                    </p>


                                    {
                                        payment.proof && (

                                            <button
                                                onClick={() =>
                                                    viewProof(
                                                        payment.proof
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
                                                📄 View Proof
                                            </button>

                                        )
                                    }

                                </div>

                            )
                        )

                    )
                }

            </div>


        </div>

    );

}


export default OwnerPayments;