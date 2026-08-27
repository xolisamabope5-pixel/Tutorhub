import {
    useEffect,
    useState
} from "react";

import BackButton
    from "../../components/BackButton";


function Payments() {


    // =========================================
    // LEARNER
    // =========================================

    const [learner, setLearner] =
        useState(null);


    // =========================================
    // TUITION CENTRE
    // =========================================

    const [program, setProgram] =
        useState(null);


    // =========================================
    // PAYMENTS
    // =========================================

    const [payments, setPayments] =
        useState([]);


    // =========================================
    // PAYMENT PROOF
    // =========================================

    const [selectedFile, setSelectedFile] =
        useState(null);


    // =========================================
    // PAYMENT FORM
    // =========================================

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
    // LOAD LEARNER
    // =========================================

    useEffect(() => {

        const savedLearner =
            localStorage.getItem(
                "learner"
            );


        if (!savedLearner) {

            return;

        }


        const learnerData =
            JSON.parse(
                savedLearner
            );


        setLearner(
            learnerData
        );


        fetchPayments(
            learnerData._id
        );


        // =====================================
        // GET PROGRAM ID
        // =====================================

        let programId = null;


        if (
            learnerData.programId &&
            typeof learnerData.programId === "object"
        ) {

            programId =
                learnerData.programId._id;

        } else {

            programId =
                learnerData.programId;

        }


        if (programId) {

            fetchProgram(
                programId
            );

        }


    }, []);


    // =========================================
    // FETCH TUITION CENTRE
    // =========================================

    const fetchProgram =
        async (programId) => {

            try {

                const response =
                    await fetch(

                        `https://tutorhub-api-bz1y.onrender.com/api/payments/program/${programId}`

                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    console.log(
                        data.message ||
                        "Could not load tuition centre"
                    );

                    return;

                }


                setProgram(
                    data
                );


                // =================================
                // AUTOMATICALLY SET MONTHLY FEE
                // =================================

                if (
                    data.monthlyFee &&
                    Number(data.monthlyFee) > 0
                ) {

                    setNewPayment(
                        previous => ({

                            ...previous,

                            amount:
                                data.monthlyFee

                        })
                    );

                }


            } catch (error) {

                console.log(
                    "Could not fetch tuition centre:",
                    error
                );

            }

        };


    // =========================================
    // FETCH LEARNER PAYMENTS
    // =========================================

    const fetchPayments =
        async (id) => {

            try {

                const response =
                    await fetch(

                        `https://tutorhub-api-bz1y.onrender.com/api/payments/learner/${id}`

                    );


                const data =
                    await response.json();


                if (
                    response.ok
                ) {

                    setPayments(
                        data
                    );

                }


            } catch (error) {

                console.log(
                    "Could not fetch payments:",
                    error
                );

            }

        };


    // =========================================
    // HANDLE PAYMENT CHANGE
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
    // SUBMIT PAYMENT
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
                    "Please complete all payment details"
                );

                return;

            }


            if (!learner) {

                alert(
                    "Learner information could not be found."
                );

                return;

            }


            if (!program) {

                alert(
                    "Tuition centre information could not be found."
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
                    "learnerId",
                    learner._id
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

                        "https://tutorhub-api-bz1y.onrender.com/api/payments/create",

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
                        "Could not submit payment"
                    );

                    return;

                }


                alert(
                    "Payment submitted successfully 🚀"
                );


                setNewPayment({

                    month: "",

                    year: "",

                    amount:
                        program.monthlyFee ||
                        ""

                });


                setSelectedFile(
                    null
                );


                const fileInput =
                    document.getElementById(
                        "learnerPaymentProof"
                    );


                if (fileInput) {

                    fileInput.value =
                        "";

                }


                setShowCreate(
                    false
                );


                fetchPayments(
                    learner._id
                );


            } catch (error) {

                console.log(
                    error
                );


                alert(
                    "Could not submit payment"
                );


            } finally {

                setSubmitting(
                    false
                );

            }

        };


    // =========================================
    // LOADING
    // =========================================

    if (!learner) {

        return (

            <div
                style={{
                    padding: "30px"
                }}
            >

                <h2>
                    Loading Payments...
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

            <h1>
                My Payments 💳
            </h1>


            <h3>

                {learner.name}{" "}
                {learner.surname}

            </h3>


            <p>

                Grade:{" "}
                {learner.grade}

            </p>


            {/* =====================================
                TUITION CENTRE PAYMENT DETAILS
            ===================================== */}

            {program && (

                <div

                    style={{

                        marginTop: "25px",

                        padding: "25px",

                        borderRadius: "16px",

                        background: "#ffffff",

                        border:
                            "1px solid #e5e7eb",

                        boxShadow:
                            "0 5px 20px rgba(0,0,0,0.05)"

                    }}

                >


                    <div
                        style={{

                            fontSize: "11px",

                            fontWeight: "800",

                            letterSpacing: "1.5px",

                            opacity: 0.55

                        }}
                    >

                        TUITION CENTRE PAYMENT DETAILS

                    </div>


                    <h2>

                        🏦 Pay{" "}
                        {program.name}

                    </h2>


                    <p
                        style={{
                            opacity: 0.7
                        }}
                    >

                        Use the banking details below
                        when making your tuition payment.

                    </p>


                    {/* =================================
                        BANK DETAILS
                    ================================= */}

                    <div
                        style={{

                            marginTop: "20px",

                            padding: "20px",

                            background:
                                "#f7f8fb",

                            borderRadius: "12px"

                        }}
                    >


                        <p>

                            <strong>
                                Bank:
                            </strong>{" "}

                            {program.bankName ||
                                "Not configured"}

                        </p>


                        <p>

                            <strong>
                                Account Holder:
                            </strong>{" "}

                            {program.accountHolder ||
                                "Not configured"}

                        </p>


                        <p>

                            <strong>
                                Account Number:
                            </strong>{" "}

                            {program.accountNumber ||
                                "Not configured"}

                        </p>


                        <p>

                            <strong>
                                Branch Code:
                            </strong>{" "}

                            {program.branchCode ||
                                "Not configured"}

                        </p>


                        <p>

                            <strong>
                                Monthly Tuition:
                            </strong>{" "}

                            R{" "}

                            {Number(
                                program.monthlyFee || 0
                            ).toFixed(2)}

                        </p>


                    </div>


                    {/* =================================
                        PAYMENT REFERENCE
                    ================================= */}

                    <div

                        style={{

                            marginTop: "20px",

                            padding: "20px",

                            borderRadius: "12px",

                            background:
                                "#fff7ed",

                            border:
                                "1px solid #fed7aa"

                        }}

                    >

                        <h3>

                            📝 IMPORTANT:
                            Payment Reference

                        </h3>


                        <p>

                            When making your payment,
                            please use your{" "}

                            <strong>
                                full name + surname +
                                grade
                            </strong>{" "}

                            as your payment reference.

                        </p>


                        <div

                            style={{

                                padding: "12px 15px",

                                background:
                                    "#ffffff",

                                borderRadius: "8px",

                                marginTop: "12px",

                                fontWeight: "800",

                                fontFamily:
                                    "monospace"

                            }}

                        >

                            Example:{" "}

                            {learner.name}{" "}
                            {learner.surname}{" "}
                            Grade{" "}
                            {learner.grade}

                        </div>


                        <p

                            style={{

                                marginBottom: 0,

                                fontSize: "13px",

                                opacity: 0.7

                            }}

                        >

                            ⚠️ Please make sure the
                            reference is correct so your
                            tuition centre can identify
                            your payment.

                        </p>


                    </div>


                </div>

            )}


            {!program && (

                <div

                    style={{

                        marginTop: "25px",

                        padding: "20px",

                        background: "#fff7ed",

                        borderRadius: "12px",

                        border:
                            "1px solid #fed7aa"

                    }}

                >

                    <strong>
                        ⚠️ Tuition centre payment
                        details are currently
                        unavailable.
                    </strong>


                    <p>

                        Please contact your tuition
                        centre before making a payment.

                    </p>

                </div>

            )}


            {/* =====================================
                CREATE PAYMENT BUTTON
            ===================================== */}

            <button

                onClick={() =>
                    setShowCreate(
                        !showCreate
                    )
                }

                disabled={!program}

                style={{

                    marginTop: "25px",

                    padding: "13px 20px",

                    border: "none",

                    borderRadius: "9px",

                    background:
                        !program
                            ? "#9ca3af"
                            : "#111827",

                    color: "#ffffff",

                    cursor:
                        !program
                            ? "not-allowed"
                            : "pointer",

                    fontWeight: "700",

                    fontSize: "15px"

                }}

            >

                {

                    showCreate

                        ? "Close Payment Form ❌"

                        : "Create Payment ➕"

                }

            </button>


            {/* =====================================
                PAYMENT FORM
            ===================================== */}

            {showCreate && program && (

                <div

                    style={{

                        border:
                            "1px solid #ccc",

                        padding: "25px",

                        marginTop: "15px",

                        borderRadius: "12px",

                        background: "#ffffff"

                    }}

                >


                    <h2>

                        Create New Payment 💳

                    </h2>


                    <p>

                        Paying:

                        <strong>

                            {" "}
                            {program.name}

                        </strong>

                    </p>


                    <form
                        onSubmit={
                            submitPayment
                        }
                    >


                        {/* MONTH */}

                        <select

                            name="month"

                            value={
                                newPayment.month
                            }

                            onChange={
                                handlePaymentChange
                            }

                            style={{

                                padding: "10px",

                                width: "100%",

                                maxWidth: "400px"

                            }}

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


                        {/* YEAR */}

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

                            style={{

                                padding: "10px",

                                width: "100%",

                                maxWidth: "400px"

                            }}

                        />


                        <br />
                        <br />


                        {/* AMOUNT */}

                        <label
                            style={{
                                display: "block",
                                marginBottom: "6px",
                                fontWeight: "700"
                            }}
                        >

                            Amount

                        </label>


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

                            min="1"

                            style={{

                                padding: "10px",

                                width: "100%",

                                maxWidth: "400px"

                            }}

                        />


                        {program.monthlyFee > 0 && (

                            <p
                                style={{
                                    fontSize: "13px",
                                    opacity: 0.65
                                }}
                            >

                                Monthly tuition fee:
                                {" "}
                                R
                                {Number(
                                    program.monthlyFee
                                ).toFixed(2)}

                            </p>

                        )}


                        <br />


                        {/* PROOF */}

                        <label
                            style={{

                                display: "block",

                                fontWeight: "700",

                                marginBottom: "8px"

                            }}
                        >

                            Payment Proof

                        </label>


                        <input

                            id="learnerPaymentProof"

                            type="file"

                            accept=".pdf,.jpg,.jpeg,.png"

                            onChange={(e) =>
                                setSelectedFile(
                                    e.target.files[0]
                                )
                            }

                        />


                        <p
                            style={{

                                fontSize: "12px",

                                opacity: 0.6

                            }}
                        >

                            Upload your payment
                            confirmation/proof.

                        </p>


                        <br />


                        {/* SUBMIT */}

                        <button

                            type="submit"

                            disabled={
                                submitting
                            }

                            style={{

                                padding:
                                    "12px 20px",

                                border: "none",

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

                    Payment History 💳

                </h2>


                {

                    payments.length === 0

                        ? (

                            <p>

                                No payment history yet.

                            </p>

                        )

                        : (

                            payments.map(
                                (payment) => (

                                    <div

                                        key={
                                            payment._id
                                        }

                                        style={{

                                            border:
                                                "1px solid #e5e7eb",

                                            padding:
                                                "20px",

                                            marginTop:
                                                "15px",

                                            borderRadius:
                                                "12px",

                                            background:
                                                "#ffffff"

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

                                            {

                                                payment.status

                                            }

                                        </p>


                                        {

                                            payment.proof && (

                                                <a

                                                    href={
                                                        `https://tutorhub-api-bz1y.onrender.com/uploads/${payment.proof}`
                                                    }

                                                    target="_blank"

                                                    rel="noreferrer"

                                                >

                                                    <button>

                                                        View Proof 📄

                                                    </button>

                                                </a>

                                            )

                                        }

                                    </div>

                                )

                            )

                        )

                }

            </div>


            {/* =====================================
                BACK
            ===================================== */}

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


export default Payments;
