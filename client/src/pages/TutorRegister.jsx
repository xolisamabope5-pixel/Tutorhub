import { useEffect, useState } from "react";

function TutorRegister() {

    const [programs, setPrograms] =
        useState([]);

    const [tutorHubPayment, setTutorHubPayment] =
        useState(null);

    const [loadingPaymentDetails, setLoadingPaymentDetails] =
        useState(false);


    const [formData, setFormData] = useState({

        name: "",

        surname: "",

        email: "",

        subjects: "",

        username: "",

        password: "",

        role: "teacher",

        programId: "",

        programName: "",

        bankName: "",

        accountHolder: "",

        accountNumber: "",

        branchCode: "",

        monthlyFee: ""

    });


    const [paymentProof, setPaymentProof] =
        useState(null);

    const [uploadingProof, setUploadingProof] =
        useState(false);

    const [uploadedProof, setUploadedProof] =
        useState("");


    // =====================================================
    // FETCH TUITION CENTRES
    // =====================================================

    useEffect(() => {

        fetchPrograms();

    }, []);


    const fetchPrograms = async () => {

        try {

            const response = await fetch(
                "https://tutorhub-api-bz1y.onrender.com/api/programs"
            );

            const data =
                await response.json();

            if (response.ok) {

                setPrograms(data);

            }

        } catch (error) {

            console.log(
                "Could not load tuition centres:",
                error
            );

        }

    };


    // =====================================================
    // FETCH TUTORHUB BANK DETAILS
    // =====================================================

    const fetchTutorHubPaymentDetails =
        async () => {

            try {

                setLoadingPaymentDetails(true);

                const response = await fetch(
                    "https://tutorhub-api-bz1y.onrender.com/api/platform-settings/owner-payment-details"
                );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Could not fetch TutorHub payment details"
                    );

                }


                console.log(
                    "TutorHub payment details:",
                    data
                );


                setTutorHubPayment(data);


            } catch (error) {

                console.log(
                    "Could not load TutorHub payment details:",
                    error
                );

                setTutorHubPayment(null);

            } finally {

                setLoadingPaymentDetails(false);

            }

        };


    // =====================================================
    // HANDLE FORM CHANGE
    // =====================================================

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;


        setFormData(prev => ({

            ...prev,

            [name]: value

        }));


        // =============================================
        // OWNER SELECTED
        // =============================================

        if (
            name === "role" &&
            value === "owner"
        ) {

            fetchTutorHubPaymentDetails();

        }


        // =============================================
        // TEACHER SELECTED
        // =============================================

        if (
            name === "role" &&
            value === "teacher"
        ) {

            setTutorHubPayment(null);

            setPaymentProof(null);

        }

    };


    // =====================================================
    // HANDLE PAYMENT PROOF CHANGE
    // =====================================================

    const handlePaymentProofChange = (e) => {

        const file =
            e.target.files[0];


        if (!file) {

            setPaymentProof(null);

            return;

        }


        // =================================================
        // CHECK FILE TYPE
        // =================================================

        const allowedTypes = [

            "application/pdf",

            "image/jpeg",

            "image/png"

        ];


        if (!allowedTypes.includes(file.type)) {

            alert(
                "Only PDF, JPG and PNG files are allowed."
            );

            e.target.value = "";

            setPaymentProof(null);

            return;

        }


        // =================================================
        // CHECK FILE SIZE
        // =================================================

        if (
            file.size >
            5 * 1024 * 1024
        ) {

            alert(
                "Payment proof must be smaller than 5 MB."
            );

            e.target.value = "";

            setPaymentProof(null);

            return;

        }


        setPaymentProof(file);

    };


    // =====================================================
    // HANDLE SUBMIT
    // =====================================================

    const handleSubmit = async (e) => {

        e.preventDefault();


        try {

            // =================================================
            // OWNER MUST HAVE PAYMENT PROOF
            // =================================================

            if (
                formData.role === "owner" &&
                !paymentProof
            ) {

                alert(
                    "Please upload your TutorHub payment proof."
                );

                return;

            }


            // =================================================
            // CREATE FORM DATA
            // =================================================

            const submissionData =
                new FormData();


            // =================================================
            // ADD ALL FORM FIELDS
            // =================================================

            Object.keys(formData).forEach((key) => {

                submissionData.append(
                    key,
                    formData[key]
                );

            });


            // =================================================
            // ADD PAYMENT PROOF
            // =================================================

            if (paymentProof) {

                submissionData.append(
                    "paymentProof",
                    paymentProof
                );

            }


            // =================================================
            // START UPLOAD
            // =================================================

            setUploadingProof(true);


            console.log(
                "Submitting tutor registration..."
            );


            const response = await fetch(
                "https://tutorhub-api-bz1y.onrender.com/api/tutors/register",
                {

                    method: "POST",

                    // IMPORTANT:
                    // Do NOT manually set Content-Type.
                    // Browser automatically sets multipart/form-data
                    // with the correct boundary.

                    body:
                        submissionData

                }
            );


            const data =
                await response.json();


            // =================================================
            // SUCCESS
            // =================================================

            if (response.ok) {

                alert(
                    "Registration submitted successfully 🚀\n\nYour account is now waiting for TutorHub admin approval."
                );


                // =================================================
                // SAVE NEWLY CREATED OWNER / TUTOR ID
                // =================================================

                if (
                    data.tutor &&
                    data.tutor._id
                ) {

                    localStorage.setItem(
                        "newOwnerId",
                        data.tutor._id
                    );

                }


                // =================================================
                // SAVE UPLOADED PROOF REFERENCE IF AVAILABLE
                // =================================================

                if (
                    data.tutor &&
                    data.tutor.paymentProof
                ) {

                    setUploadedProof(
                        data.tutor.paymentProof
                    );

                }


                // =================================================
                // CLEAR PAYMENT PROOF
                // =================================================

                setPaymentProof(null);


                // =================================================
                // RESET FORM
                // =================================================

                setFormData({

                    name: "",

                    surname: "",

                    email: "",

                    subjects: "",

                    username: "",

                    password: "",

                    role: "teacher",

                    programId: "",

                    programName: "",

                    bankName: "",

                    accountHolder: "",

                    accountNumber: "",

                    branchCode: "",

                    monthlyFee: ""

                });


            } else {

                alert(
                    data.message ||
                    "Registration failed"
                );

            }


        } catch (error) {

            console.log(
                "Registration error:",
                error
            );


            alert(
                "Server connection failed"
            );


        } finally {

            setUploadingProof(false);

        }

    };


    // =====================================================
    // PAGE
    // =====================================================

    return (

        <div
            style={{
                maxWidth: "650px",
                margin: "40px auto",
                padding: "20px"
            }}
        >

            <h1>
                TutorHub
            </h1>


            <h2>
                Tutor Registration
            </h2>


            <form
                onSubmit={handleSubmit}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                }}
            >

                {/* =========================================
                    PERSONAL DETAILS
                ========================================= */}

                <input
                    name="name"
                    placeholder="Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />


                <input
                    name="surname"
                    placeholder="Surname"
                    value={formData.surname}
                    onChange={handleChange}
                    required
                />


                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />


                <input
                    name="subjects"
                    placeholder="Subjects you teach"
                    value={formData.subjects}
                    onChange={handleChange}
                />


                {/* =========================================
                    ACCOUNT TYPE
                ========================================= */}

                <h3>
                    Account Type
                </h3>


                <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                >

                    <option value="teacher">
                        Teacher
                    </option>

                    <option value="owner">
                        Tuition Owner
                    </option>

                </select>


                {/* =========================================
                    OWNER
                ========================================= */}

                {formData.role === "owner" ? (

                    <div
                        style={{
                            border:
                                "1px solid #d9dee8",
                            borderRadius: "12px",
                            padding: "20px",
                            background: "#f8faff"
                        }}
                    >

                        <h3>
                            🏫 Tuition Centre Registration
                        </h3>


                        <input
                            name="programName"
                            placeholder="Tuition Centre Name"
                            value={
                                formData.programName
                            }
                            onChange={
                                handleChange
                            }
                            required
                            style={{
                                width: "100%",
                                boxSizing:
                                    "border-box",
                                padding: "10px",
                                marginBottom:
                                    "15px"
                            }}
                        />


                        {/* =====================================
                            TUTORHUB PAYMENT
                        ===================================== */}

                        <div
                            style={{
                                border:
                                    "1px solid #cfd8ea",
                                borderRadius: "12px",
                                padding: "18px",
                                background:
                                    "#ffffff",
                                marginBottom:
                                    "18px"
                            }}
                        >

                            <h3>
                                💳 Pay TutorHub
                            </h3>


                            <p
                                style={{
                                    fontSize:
                                        "13px",
                                    opacity:
                                        0.7
                                }}
                            >
                                Your tuition centre must
                                pay the TutorHub subscription
                                before your centre can be
                                approved.
                            </p>


                            {loadingPaymentDetails ? (

                                <p>
                                    Loading TutorHub
                                    payment details...
                                </p>

                            ) : tutorHubPayment ? (

                                <div
                                    style={{
                                        display:
                                            "flex",
                                        flexDirection:
                                            "column",
                                        gap: "10px"
                                    }}
                                >

                                    <div>

                                        <strong>
                                            Bank:
                                        </strong>{" "}

                                        {
                                            tutorHubPayment
                                                .tutorhubBankName ||
                                            "Not configured"
                                        }

                                    </div>


                                    <div>

                                        <strong>
                                            Account Holder:
                                        </strong>{" "}

                                        {
                                            tutorHubPayment
                                                .tutorhubAccountHolder ||
                                            "Not configured"
                                        }

                                    </div>


                                    <div>

                                        <strong>
                                            Account Number:
                                        </strong>{" "}

                                        {
                                            tutorHubPayment
                                                .tutorhubAccountNumber ||
                                            "Not configured"
                                        }

                                    </div>


                                    <div>

                                        <strong>
                                            Branch Code:
                                        </strong>{" "}

                                        {
                                            tutorHubPayment
                                                .tutorhubBranchCode ||
                                            "Not configured"
                                        }

                                    </div>


                                    <div>

                                        <strong>
                                            Account Type:
                                        </strong>{" "}

                                        {
                                            tutorHubPayment
                                                .tutorhubAccountType ||
                                            "Not configured"
                                        }

                                    </div>


                                    <div>

                                        <strong>
                                            Monthly Subscription:
                                        </strong>{" "}

                                        {
                                            tutorHubPayment
                                                .currency ||
                                            "ZAR"
                                        }

                                        {" "}

                                        {

                                            Number(
                                                tutorHubPayment
                                                    .monthlySubscription ||
                                                0
                                            ).toFixed(2)

                                        }

                                    </div>

                                </div>

                            ) : (

                                <div
                                    style={{
                                        padding:
                                            "12px",
                                        borderRadius:
                                            "8px",
                                        background:
                                            "#fff0f0",
                                        color:
                                            "#a33a3a"
                                    }}
                                >

                                    TutorHub payment
                                    details could not
                                    be loaded.

                                </div>

                            )}

                        </div>


                        {/* =====================================
                            PAYMENT PROOF UPLOAD
                        ===================================== */}

                        <div
                            style={{
                                border:
                                    "1px solid #cfd8ea",
                                borderRadius:
                                    "12px",
                                padding:
                                    "18px",
                                background:
                                    "#ffffff",
                                marginBottom:
                                    "18px"
                            }}
                        >

                            <h3>
                                📄 TutorHub Payment Proof
                            </h3>


                            <p
                                style={{
                                    fontSize:
                                        "13px",
                                    opacity:
                                        0.7
                                }}
                            >
                                Upload proof that your tuition
                                centre has paid the TutorHub
                                subscription.
                            </p>


                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={
                                    handlePaymentProofChange
                                }
                                required
                            />


                            {paymentProof && (

                                <p
                                    style={{
                                        fontSize:
                                            "13px",
                                        marginTop:
                                            "8px"
                                    }}
                                >

                                    Selected file:{" "}

                                    <strong>
                                        {
                                            paymentProof.name
                                        }
                                    </strong>

                                </p>

                            )}


                            <p
                                style={{
                                    fontSize:
                                        "12px",
                                    opacity:
                                        0.6,
                                    marginTop:
                                        "8px"
                                }}
                            >
                                Accepted formats: PDF, JPG and
                                PNG. Maximum size: 5 MB.
                            </p>

                        </div>


                        {/* =====================================
                            CENTRE BANK DETAILS
                        ===================================== */}

                        <h3>
                            🏦 Tuition Centre Payment Details
                        </h3>


                        <p
                            style={{
                                fontSize: "13px",
                                opacity: 0.7
                            }}
                        >
                            These are YOUR tuition centre's
                            banking details. Learners will use
                            these details when paying your centre.
                        </p>


                        <input
                            name="bankName"
                            placeholder="Bank Name"
                            value={formData.bankName}
                            onChange={handleChange}
                            required
                        />


                        <input
                            name="accountHolder"
                            placeholder="Account Holder"
                            value={
                                formData.accountHolder
                            }
                            onChange={
                                handleChange
                            }
                            required
                        />


                        <input
                            name="accountNumber"
                            placeholder="Account Number"
                            value={
                                formData.accountNumber
                            }
                            onChange={
                                handleChange
                            }
                            required
                        />


                        <input
                            name="branchCode"
                            placeholder="Branch Code"
                            value={
                                formData.branchCode
                            }
                            onChange={
                                handleChange
                            }
                            required
                        />


                        <input
                            type="number"
                            name="monthlyFee"
                            placeholder="Monthly Tuition Fee"
                            value={
                                formData.monthlyFee
                            }
                            onChange={
                                handleChange
                            }
                            required
                        />

                    </div>

                ) : (

                    /* =========================================
                       TEACHER
                    ========================================= */

                    <div>

                        <select
                            name="programId"
                            value={
                                formData.programId
                            }
                            onChange={
                                handleChange
                            }
                            required
                        >

                            <option value="">
                                Choose Tuition Centre
                            </option>


                            {
                                programs.map(
                                    program => (

                                        <option
                                            key={
                                                program._id
                                            }
                                            value={
                                                program._id
                                            }
                                        >

                                            {
                                                program.name
                                            }

                                        </option>

                                    )
                                )
                            }

                        </select>


                        <p
                            style={{
                                fontSize: "13px",
                                opacity: 0.65
                            }}
                        >
                            You will teach under the
                            selected tuition centre.
                        </p>

                    </div>

                )}


                {/* =========================================
                    LOGIN DETAILS
                ========================================= */}

                <input
                    name="username"
                    placeholder="Create Username"
                    value={
                        formData.username
                    }
                    onChange={handleChange}
                    required
                />


                <input
                    type="password"
                    name="password"
                    placeholder="Create Password"
                    value={
                        formData.password
                    }
                    onChange={handleChange}
                    required
                />


                <button
                    type="submit"
                    disabled={uploadingProof}
                    style={{
                        padding: "12px",
                        cursor: uploadingProof
                            ? "not-allowed"
                            : "pointer",
                        fontWeight: "700",
                        opacity: uploadingProof
                            ? 0.6
                            : 1
                    }}
                >

                    {uploadingProof
                        ? "Submitting Registration..."
                        : "Register"}

                </button>

            </form>

        </div>

    );

}

export default TutorRegister;
