import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/admin-responsive.css";
function Admin() {

    const navigate = useNavigate();

    const API_URL = "https://tutorhub-api-bz1y.onrender.com";

    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);

    // =========================================
    // OWNER PAYMENTS
    // =========================================

    const [ownerPayments, setOwnerPayments] = useState([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);

    // =========================================
    // PLATFORM SETTINGS
    // =========================================

    const [showSettings, setShowSettings] = useState(false);

    const [platformSettings, setPlatformSettings] = useState({
        platformName: "TutorHub",
        tagline: "Smart Tuition Management Platform",
        primaryColor: "#111827",
        secondaryColor: "#eef2ff",
        currency: "ZAR",
        monthlySubscription: 499,
        tutorhubBankName: "",
        tutorhubAccountHolder: "",
        tutorhubAccountNumber: "",
        tutorhubBranchCode: "",
        tutorhubPaymentProof: ""
    });

    const [savingSettings, setSavingSettings] = useState(false);

    // =========================================
    // CHANGE ADMIN LOGIN
    // =========================================

    const [showChangeLogin, setShowChangeLogin] = useState(false);

    const [changeLoginData, setChangeLoginData] = useState({
        currentPassword: "",
        newUsername: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [changingLogin, setChangingLogin] = useState(false);

    // =========================================
    // GET ADMIN TOKEN
    // =========================================

    const getAdminToken = () => {

        return localStorage.getItem("adminToken");

    };

    // =========================================
    // ADMIN AUTH HEADERS
    // =========================================

    const getAdminHeaders = (includeJson = false) => {

        const token = getAdminToken();

        const headers = {};

        if (includeJson) {

            headers["Content-Type"] =
                "application/json";

        }

        if (token) {

            headers["Authorization"] =
                `Bearer ${token}`;

        }

        return headers;

    };

    // =========================================
    // HANDLE UNAUTHORIZED
    // =========================================

    const handleUnauthorized = (response) => {

        if (response.status === 401 ||
            response.status === 403) {

            localStorage.removeItem(
                "adminLoggedIn"
            );

            localStorage.removeItem(
                "adminToken"
            );

            localStorage.removeItem(
                "adminUsername"
            );

            alert(
                "Your admin session has expired. Please login again."
            );

            navigate("/admin-login");

            return true;

        }

        return false;

    };

    // =========================================
    // CHECK ADMIN LOGIN
    // =========================================

    useEffect(() => {

        const isLoggedIn =
            localStorage.getItem("adminLoggedIn");

        const token =
            localStorage.getItem("adminToken");

        if (!isLoggedIn || !token) {

            navigate("/admin-login");

        }

    }, [navigate]);

    // =========================================
    // FETCH TUITION CENTRES
    // =========================================

    const fetchPrograms = async () => {

        try {

            setLoading(true);

            const response = await fetch(
                `${API_URL}/api/admin/programs`,
                {
                    method: "GET",
                    headers: getAdminHeaders()
                }
            );

            if (handleUnauthorized(response)) {
                return;
            }

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Could not fetch tuition centres"
                );

            }

            setPrograms(
                Array.isArray(data)
                    ? data
                    : []
            );

        } catch (error) {

            console.log(
                "Could not load tuition centres:",
                error
            );

            setPrograms([]);

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        fetchPrograms();

    }, []);

    // =========================================
    // FETCH OWNER PAYMENTS
    // =========================================

    const fetchOwnerPayments = async () => {

        try {

            setPaymentsLoading(true);

            const response = await fetch(
                `${API_URL}/api/owner-payments/`,
                {
                    method: "GET",
                    headers: getAdminHeaders()
                }
            );

            if (handleUnauthorized(response)) {
                return;
            }

            if (!response.ok) {

                throw new Error(
                    "Could not fetch TutorHub payments"
                );

            }

            const data =
                await response.json();

            setOwnerPayments(
                Array.isArray(data)
                    ? data
                    : []
            );

        } catch (error) {

            console.log(
                "Could not load owner payments:",
                error
            );

        } finally {

            setPaymentsLoading(false);

        }

    };

    useEffect(() => {

        fetchOwnerPayments();

    }, []);

    // =========================================
    // FETCH PLATFORM SETTINGS
    // =========================================

    const fetchPlatformSettings = async () => {

        try {

            const response = await fetch(
                `${API_URL}/api/platform-settings`,
                {
                    method: "GET",
                    headers: getAdminHeaders()
                }
            );

            if (handleUnauthorized(response)) {
                return;
            }

            if (!response.ok) {

                throw new Error(
                    "Could not fetch platform settings"
                );

            }

            const data =
                await response.json();

            setPlatformSettings({

                platformName:
                    data.platformName ||
                    "TutorHub",

                tagline:
                    data.tagline ||
                    "Smart Tuition Management Platform",

                primaryColor:
                    data.primaryColor ||
                    "#111827",

                secondaryColor:
                    data.secondaryColor ||
                    "#eef2ff",

                currency:
                    data.currency ||
                    "ZAR",

                monthlySubscription:
                    data.monthlySubscription ?? 499,

                tutorhubBankName:
                    data.tutorhubBankName || "",

                tutorhubAccountHolder:
                    data.tutorhubAccountHolder || "",

                tutorhubAccountNumber:
                    data.tutorhubAccountNumber || "",

                tutorhubBranchCode:
                    data.tutorhubBranchCode || "",

                tutorhubPaymentProof:
                    data.tutorhubPaymentProof || ""

            });

        } catch (error) {

            console.log(
                "Could not load platform settings:",
                error
            );

        }

    };

    useEffect(() => {

        fetchPlatformSettings();

    }, []);

    // =========================================
    // OPEN SETTINGS
    // =========================================

    const openSettings = () => {

        fetchPlatformSettings();

        setShowSettings(true);

        setShowChangeLogin(false);

    };

    // =========================================
    // CLOSE SETTINGS
    // =========================================

    const closeSettings = () => {

        setShowSettings(false);

    };

    // =========================================
    // OPEN CHANGE LOGIN
    // =========================================

    const openChangeLogin = () => {

        setShowChangeLogin(true);

        setShowSettings(false);

    };

    // =========================================
    // CLOSE CHANGE LOGIN
    // =========================================

    const closeChangeLogin = () => {

        if (changingLogin) {
            return;
        }

        setShowChangeLogin(false);

        setChangeLoginData({
            currentPassword: "",
            newUsername: "",
            newPassword: "",
            confirmPassword: ""
        });

    };

    // =========================================
    // HANDLE SETTINGS CHANGE
    // =========================================

    const handleSettingsChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setPlatformSettings(prev => ({

            ...prev,

            [name]: value

        }));

    };

    // =========================================
    // SAVE PLATFORM SETTINGS
    // =========================================

    const savePlatformSettings = async () => {

        if (
            !platformSettings
                .platformName
                .trim()
        ) {

            alert(
                "Platform name cannot be empty."
            );

            return;

        }

        try {

            setSavingSettings(true);

            const response = await fetch(
                `${API_URL}/api/platform-settings`,
                {
                    method: "PUT",

                    headers:
                        getAdminHeaders(true),

                    body:
                        JSON.stringify(
                            platformSettings
                        )
                }
            );

            if (handleUnauthorized(response)) {
                return;
            }

            const data =
                await response.json();

            if (!response.ok) {

                alert(
                    data.message ||
                    "Could not save platform settings."
                );

                return;

            }

            setPlatformSettings(prev => ({

                ...prev,

                platformName:
                    data.platformName ||
                    prev.platformName,

                tagline:
                    data.tagline ||
                    prev.tagline,

                primaryColor:
                    data.primaryColor ||
                    prev.primaryColor,

                secondaryColor:
                    data.secondaryColor ||
                    prev.secondaryColor,

                currency:
                    data.currency ||
                    prev.currency,

                monthlySubscription:
                    data.monthlySubscription ??
                    prev.monthlySubscription,

                tutorhubBankName:
                    data.tutorhubBankName ||
                    "",

                tutorhubAccountHolder:
                    data.tutorhubAccountHolder ||
                    "",

                tutorhubAccountNumber:
                    data.tutorhubAccountNumber ||
                    "",

                tutorhubBranchCode:
                    data.tutorhubBranchCode ||
                    "",

                tutorhubPaymentProof:
                    data.tutorhubPaymentProof ||
                    prev.tutorhubPaymentProof

            }));

            alert(
                "Platform settings updated successfully 🚀"
            );

            setShowSettings(false);

        } catch (error) {

            console.log(error);

            alert(
                "Something went wrong while saving settings."
            );

        } finally {

            setSavingSettings(false);

        }

    };

    // =========================================
    // CHANGE ADMIN LOGIN
    // =========================================

    const changeAdminLogin = async () => {

        const {
            currentPassword,
            newUsername,
            newPassword,
            confirmPassword
        } = changeLoginData;

        if (
            !currentPassword ||
            !newUsername ||
            !newPassword ||
            !confirmPassword
        ) {

            alert(
                "Please complete all fields."
            );

            return;

        }

        if (
            newPassword !==
            confirmPassword
        ) {

            alert(
                "New passwords do not match."
            );

            return;

        }

        if (
            newPassword.length < 5
        ) {

            alert(
                "New password must be at least 5 characters."
            );

            return;

        }

        try {

            setChangingLogin(true);

            const response = await fetch(
                `${API_URL}/api/admin/change-login`,
                {
                    method: "PUT",

                    headers:
                        getAdminHeaders(true),

                    body:
                        JSON.stringify({

                            currentPassword,

                            newUsername:
                                newUsername.trim(),

                            newPassword

                        })
                }
            );

            if (handleUnauthorized(response)) {
                return;
            }

            const data =
                await response.json();

            if (!response.ok) {

                alert(
                    data.message ||
                    "Could not change admin login."
                );

                return;

            }

            /*
             * The backend issues a new token.
             * Store it immediately.
             */

            if (data.token) {

                localStorage.setItem(
                    "adminToken",
                    data.token
                );

            }

            if (data.username) {

                localStorage.setItem(
                    "adminUsername",
                    data.username
                );

            }

            alert(
                "Admin login changed successfully 🚀\n\nYou will now be logged out."
            );

            setChangeLoginData({
                currentPassword: "",
                newUsername: "",
                newPassword: "",
                confirmPassword: ""
            });

            setShowChangeLogin(false);

            localStorage.removeItem(
                "adminLoggedIn"
            );

            localStorage.removeItem(
                "adminToken"
            );

            navigate("/admin-login");

        } catch (error) {

            console.log(
                "Change admin login error:",
                error
            );

            alert(
                "Something went wrong while changing the login."
            );

        } finally {

            setChangingLogin(false);

        }

    };

    // =========================================
    // APPROVE TUITION CENTRE
    // =========================================

    const approveProgram = async (id) => {

        try {

            const response = await fetch(
                `${API_URL}/api/admin/approve-program/${id}`,
                {
                    method: "PUT",
                    headers: getAdminHeaders()
                }
            );

            if (handleUnauthorized(response)) {
                return;
            }

            const data =
                await response.json();

            if (!response.ok) {

                alert(
                    data.message ||
                    "Could not approve tuition centre"
                );

                return;

            }

            alert(
                "Tuition centre approved successfully 🚀"
            );

            await fetchPrograms();

        } catch (error) {

            console.log(error);

            alert(
                "Something went wrong while approving the centre."
            );

        }

    };

    // =========================================
    // BLOCK TUITION CENTRE
    // =========================================

    const blockProgram = async (id) => {

        const confirmBlock =
            window.confirm(
                "Are you sure you want to block this tuition centre? Its owner, tutors and learners will lose access."
            );

        if (!confirmBlock) {
            return;
        }

        try {

            const response = await fetch(
                `${API_URL}/api/admin/block-program/${id}`,
                {
                    method: "PUT",
                    headers: getAdminHeaders()
                }
            );

            if (handleUnauthorized(response)) {
                return;
            }

            const data =
                await response.json();

            if (!response.ok) {

                alert(
                    data.message ||
                    "Could not block tuition centre"
                );

                return;

            }

            alert(
                "Tuition centre blocked."
            );

            await fetchPrograms();

        } catch (error) {

            console.log(error);

            alert(
                "Something went wrong while blocking the centre."
            );

        }

    };

    // =========================================
    // UNBLOCK TUITION CENTRE
    // =========================================

    const unblockProgram = async (id) => {

        try {

            const response = await fetch(
                `${API_URL}/api/admin/unblock-program/${id}`,
                {
                    method: "PUT",
                    headers: getAdminHeaders()
                }
            );

            if (handleUnauthorized(response)) {
                return;
            }

            const data =
                await response.json();

            if (!response.ok) {

                alert(
                    data.message ||
                    "Could not unblock tuition centre"
                );

                return;

            }

            alert(
                "Tuition centre unblocked successfully 🔓"
            );

            await fetchPrograms();

        } catch (error) {

            console.log(error);

            alert(
                "Something went wrong while unblocking the centre."
            );

        }

    };

    // =========================================
    // DELETE TUITION CENTRE
    // =========================================

    const deleteProgram = async (
        id,
        name
    ) => {

        const confirmDelete =
            window.confirm(

                `⚠️ DELETE TUITION CENTRE\n\nAre you sure you want to permanently delete "${name}"?\n\nThis will remove the tuition centre and its associated owner, tutors and learners.\n\nTHIS ACTION CANNOT BE UNDONE.`

            );

        if (!confirmDelete) {
            return;
        }

        try {

            /*
             * Remove the card immediately so the
             * dashboard feels responsive.
             */

            setPrograms(prev =>
                prev.filter(
                    program =>
                        program._id !== id
                )
            );

            const response = await fetch(
                `${API_URL}/api/admin/delete-program/${id}`,
                {
                    method: "DELETE",

                    headers:
                        getAdminHeaders()
                }
            );

            if (handleUnauthorized(response)) {
                await fetchPrograms();
                return;
            }

            const data =
                await response.json();

            if (!response.ok) {

                /*
                 * If deletion failed,
                 * reload the real data.
                 */

                await fetchPrograms();

                alert(
                    data.message ||
                    "Could not delete tuition centre."
                );

                return;

            }

            alert(
                "Tuition centre deleted successfully 🗑️"
            );

            await fetchPrograms();
            await fetchOwnerPayments();

        } catch (error) {

            console.log(
                "Delete tuition centre error:",
                error
            );

            await fetchPrograms();

            alert(
                "Something went wrong while deleting the tuition centre."
            );

        }

    };

    // =========================================
    // OPEN PAYMENT PROOF
    // =========================================

    const viewPaymentProof = (
        paymentProof
    ) => {

        if (!paymentProof) {

            alert(
                "No payment proof has been uploaded yet."
            );

            return;

        }

        const fileUrl =
            `${API_URL}/uploads/${paymentProof}`;

        window.open(
            fileUrl,
            "_blank"
        );

    };

    // =========================================
    // APPROVE OWNER PAYMENT
    // =========================================

    const approveOwnerPayment = async (
        id
    ) => {

        const confirmApprove =
            window.confirm(
                "Approve this TutorHub payment? The tuition centre subscription will be marked as Paid."
            );

        if (!confirmApprove) {
            return;
        }

        try {

            const response = await fetch(
                `${API_URL}/api/owner-payments/${id}/approve`,
                {
                    method: "PUT",
                    headers: getAdminHeaders()
                }
            );

            if (handleUnauthorized(response)) {
                return;
            }

            const data =
                await response.json();

            if (!response.ok) {

                alert(
                    data.message ||
                    "Could not approve payment."
                );

                return;

            }

            alert(
                "TutorHub payment approved successfully ✅"
            );

            await fetchOwnerPayments();
            await fetchPrograms();

        } catch (error) {

            console.log(
                "Approve owner payment error:",
                error
            );

            alert(
                "Something went wrong while approving the payment."
            );

        }

    };

    // =========================================
    // REJECT OWNER PAYMENT
    // =========================================

    const rejectOwnerPayment = async (
        id
    ) => {

        const confirmReject =
            window.confirm(
                "Are you sure you want to reject this TutorHub payment?"
            );

        if (!confirmReject) {
            return;
        }

        try {

            const response = await fetch(
                `${API_URL}/api/owner-payments/${id}/reject`,
                {
                    method: "PUT",
                    headers: getAdminHeaders()
                }
            );

            if (handleUnauthorized(response)) {
                return;
            }

            const data =
                await response.json();

            if (!response.ok) {

                alert(
                    data.message ||
                    "Could not reject payment."
                );

                return;

            }

            alert(
                "TutorHub payment rejected."
            );

            await fetchOwnerPayments();

        } catch (error) {

            console.log(
                "Reject owner payment error:",
                error
            );

            alert(
                "Something went wrong while rejecting the payment."
            );

        }

    };

    // =========================================
    // FORMAT PAYMENT DATE
    // =========================================

    const formatPaymentDate = (
        date
    ) => {

        if (!date) {
            return "—";
        }

        try {

            return new Date(
                date
            ).toLocaleDateString(
                "en-ZA",
                {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                }
            );

        } catch {

            return "—";

        }

    };

    // =========================================
    // PAYMENT STATISTICS
    // =========================================

    const pendingPayments =
        ownerPayments.filter(
            payment =>
                payment.status ===
                "Pending"
        );

    const paidPayments =
        ownerPayments.filter(
            payment =>
                payment.status ===
                "Paid"
        );

    const rejectedPayments =
        ownerPayments.filter(
            payment =>
                payment.status ===
                "Rejected"
        );

    const totalPaid =
        paidPayments.reduce(
            (total, payment) =>
                total +
                Number(
                    payment.amount || 0
                ),
            0
        );

    // =========================================
    // LOGOUT
    // =========================================

    const logout = () => {

        localStorage.removeItem(
            "adminLoggedIn"
        );

        localStorage.removeItem(
            "adminToken"
        );

        localStorage.removeItem(
            "adminUsername"
        );

        navigate(
            "/admin-login"
        );

    };

    // =========================================
    // LOADING
    // =========================================

    if (loading) {

        return (

            <div style={styles.page}>

                <div style={styles.loadingCard}>

                    <div style={styles.loadingIcon}>
                        🏫
                    </div>

                    <h2>
                        Loading TutorHub Admin...
                    </h2>

                    <p>
                        Fetching tuition centres.
                    </p>

                </div>

            </div>

        );

    }

    // =========================================
    // DASHBOARD
    // =========================================

    return (

        <div className="admin-page" style={styles.page}>

            <div className="admin-container" style={styles.container}>

                {/* =====================================
                    HEADER
                ===================================== */}

                <div className="admin-header" style={styles.header}>

                    <div>

                        <p style={styles.eyebrow}>
                            TUTORHUB ADMIN
                        </p>

                            <h1 className="admin-title" style={styles.title}>
                            Tuition Centre Management
                        </h1>

                        <p className="admin-subtitle" style={styles.subtitle}>
                            Manage tuition centres,
                            subscriptions and platform access.
                        </p>

                    </div>

                    <div className="admin-header-actions" style={styles.headerActions}>

                        <button
                            style={
                                styles.settingsButton
                            }
                            onClick={
                                openSettings
                            }
                        >
                            ⚙️ Platform Settings
                        </button>

                        <button
                            style={
                                styles.changePasswordButton
                            }
                            onClick={
                                openChangeLogin
                            }
                        >
                            🔐 Change Login
                        </button>

                        <button
                            style={
                                styles.logoutButton
                            }
                            onClick={
                                logout
                            }
                        >
                            Logout
                        </button>

                    </div>

                </div>

                {/* =====================================
                    CHANGE ADMIN LOGIN
                ===================================== */}

                {showChangeLogin && (

                    <div
                        style={
                            styles.settingsCard
                        }
                    >

                        <div
                            style={
                                styles.settingsHeader
                            }
                        >

                            <div>

                                <p
                                    style={
                                        styles.eyebrow
                                    }
                                >
                                    SECURITY
                                </p>

                                <h2
                                    style={
                                        styles.settingsTitle
                                    }
                                >
                                    🔐 Change Admin Login
                                </h2>

                                <p
                                    style={
                                        styles.settingsDescription
                                    }
                                >
                                    Update the administrator
                                    username and password.
                                </p>

                            </div>

                            <button
                                style={
                                    styles.closeButton
                                }
                                onClick={
                                    closeChangeLogin
                                }
                                disabled={
                                    changingLogin
                                }
                            >
                                ✕
                            </button>

                        </div>

                        <div
                            style={
                                styles.loginChangeCard
                            }
                        >

                            <div
                                style={
                                    styles.loginField
                                }
                            >

                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    Current Password
                                </label>

                                <input
                                    type="password"
                                    value={
                                        changeLoginData
                                            .currentPassword
                                    }
                                    onChange={(e) =>
                                        setChangeLoginData(
                                            prev => ({
                                                ...prev,
                                                currentPassword:
                                                    e.target.value
                                            })
                                        )
                                    }
                                    placeholder="Enter current password"
                                    style={
                                        styles.input
                                    }
                                    autoComplete="current-password"
                                />

                            </div>

                            <div
                                style={
                                    styles.loginField
                                }
                            >

                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    New Username
                                </label>

                                <input
                                    type="text"
                                    value={
                                        changeLoginData
                                            .newUsername
                                    }
                                    onChange={(e) =>
                                        setChangeLoginData(
                                            prev => ({
                                                ...prev,
                                                newUsername:
                                                    e.target.value
                                            })
                                        )
                                    }
                                    placeholder="Enter new username"
                                    style={
                                        styles.input
                                    }
                                    autoComplete="username"
                                />

                            </div>

                            <div
                                style={
                                    styles.loginField
                                }
                            >

                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    New Password
                                </label>

                                <input
                                    type="password"
                                    value={
                                        changeLoginData
                                            .newPassword
                                    }
                                    onChange={(e) =>
                                        setChangeLoginData(
                                            prev => ({
                                                ...prev,
                                                newPassword:
                                                    e.target.value
                                            })
                                        )
                                    }
                                    placeholder="Enter new password"
                                    style={
                                        styles.input
                                    }
                                    autoComplete="new-password"
                                />

                            </div>

                            <div
                                style={
                                    styles.loginField
                                }
                            >

                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    Confirm New Password
                                </label>

                                <input
                                    type="password"
                                    value={
                                        changeLoginData
                                            .confirmPassword
                                    }
                                    onChange={(e) =>
                                        setChangeLoginData(
                                            prev => ({
                                                ...prev,
                                                confirmPassword:
                                                    e.target.value
                                            })
                                        )
                                    }
                                    placeholder="Confirm new password"
                                    style={
                                        styles.input
                                    }
                                    autoComplete="new-password"
                                />

                            </div>

                        </div>

                        <div
                            style={
                                styles.securityNotice
                            }
                        >

                            <span
                                style={
                                    styles.securityIcon
                                }
                            >
                                🔒
                            </span>

                            <div>

                                <strong>
                                    Security Notice
                                </strong>

                                <p
                                    style={
                                        styles.securityText
                                    }
                                >
                                    After changing the admin
                                    login details, you will be
                                    logged out automatically and
                                    must sign in again using the
                                    new credentials.
                                </p>

                            </div>

                        </div>

                        <div
                            style={
                                styles.settingsActions
                            }
                        >

                            <button
                                style={
                                    styles.cancelButton
                                }
                                onClick={
                                    closeChangeLogin
                                }
                                disabled={
                                    changingLogin
                                }
                            >
                                Cancel
                            </button>

                            <button
                                style={
                                    styles.saveLoginButton
                                }
                                onClick={
                                    changeAdminLogin
                                }
                                disabled={
                                    changingLogin
                                }
                            >
                                {
                                    changingLogin
                                        ? "Saving..."
                                        : "💾 Save Login Changes"
                                }
                            </button>

                        </div>

                    </div>

                )}

                {/* =====================================
                    PLATFORM SETTINGS
                ===================================== */}

                {showSettings && (

                    <div
                        style={
                            styles.settingsCard
                        }
                    >

                        <div
                            style={
                                styles.settingsHeader
                            }
                        >

                            <div>

                                <p
                                    style={
                                        styles.eyebrow
                                    }
                                >
                                    PLATFORM CONTROL
                                </p>

                                <h2
                                    style={
                                        styles.settingsTitle
                                    }
                                >
                                    ⚙️ Edit Platform Settings
                                </h2>

                                <p
                                    style={
                                        styles.settingsDescription
                                    }
                                >
                                    Manage TutorHub branding,
                                    subscription and banking details.
                                </p>

                            </div>

                            <button
                                style={
                                    styles.closeButton
                                }
                                onClick={
                                    closeSettings
                                }
                            >
                                ✕
                            </button>

                        </div>

                        <div
                            style={
                                styles.formGrid
                            }
                        >

                            <div>

                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    Platform Name
                                </label>

                                <input
                                    type="text"
                                    name="platformName"
                                    value={
                                        platformSettings
                                            .platformName
                                    }
                                    onChange={
                                        handleSettingsChange
                                    }
                                    style={
                                        styles.input
                                    }
                                />

                            </div>

                            <div>

                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    Tagline
                                </label>

                                <input
                                    type="text"
                                    name="tagline"
                                    value={
                                        platformSettings
                                            .tagline
                                    }
                                    onChange={
                                        handleSettingsChange
                                    }
                                    style={
                                        styles.input
                                    }
                                />

                            </div>

                            <div>

                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    TutorHub Monthly Subscription
                                </label>

                                <input
                                    type="number"
                                    name="monthlySubscription"
                                    value={
                                        platformSettings
                                            .monthlySubscription
                                    }
                                    onChange={
                                        handleSettingsChange
                                    }
                                    style={
                                        styles.input
                                    }
                                />

                            </div>

                            <div>

                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    Currency
                                </label>

                                <input
                                    type="text"
                                    name="currency"
                                    value={
                                        platformSettings
                                            .currency
                                    }
                                    onChange={
                                        handleSettingsChange
                                    }
                                    style={
                                        styles.input
                                    }
                                />

                            </div>

                            <div>

                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    Primary Colour
                                </label>

                                <div
                                    style={
                                        styles.colorInputRow
                                    }
                                >

                                    <input
                                        type="color"
                                        name="primaryColor"
                                        value={
                                            platformSettings
                                                .primaryColor
                                        }
                                        onChange={
                                            handleSettingsChange
                                        }
                                        style={
                                            styles.colorPicker
                                        }
                                    />

                                    <input
                                        type="text"
                                        name="primaryColor"
                                        value={
                                            platformSettings
                                                .primaryColor
                                        }
                                        onChange={
                                            handleSettingsChange
                                        }
                                        style={
                                            styles.colorTextInput
                                        }
                                    />

                                </div>

                            </div>

                            <div>

                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    Secondary Colour
                                </label>

                                <div
                                    style={
                                        styles.colorInputRow
                                    }
                                >

                                    <input
                                        type="color"
                                        name="secondaryColor"
                                        value={
                                            platformSettings
                                                .secondaryColor
                                        }
                                        onChange={
                                            handleSettingsChange
                                        }
                                        style={
                                            styles.colorPicker
                                        }
                                    />

                                    <input
                                        type="text"
                                        name="secondaryColor"
                                        value={
                                            platformSettings
                                                .secondaryColor
                                        }
                                        onChange={
                                            handleSettingsChange
                                        }
                                        style={
                                            styles.colorTextInput
                                        }
                                    />

                                </div>

                            </div>

                        </div>

                        <div
                            style={
                                styles.bankCard
                            }
                        >

                            <p
                                style={
                                    styles.eyebrow
                                }
                            >
                                TUTORHUB PAYMENTS
                            </p>

                            <h2
                                style={
                                    styles.bankTitle
                                }
                            >
                                🏦 TutorHub Banking Details
                            </h2>

                            <p
                                style={
                                    styles.bankDescription
                                }
                            >
                                These are the banking details
                                tuition centre owners will use
                                to pay TutorHub.
                            </p>

                            <div
                                style={
                                    styles.formGrid
                                }
                            >

                                <div>

                                    <label
                                        style={
                                            styles.label
                                        }
                                    >
                                        Bank Name
                                    </label>

                                    <input
                                        type="text"
                                        name="tutorhubBankName"
                                        value={
                                            platformSettings
                                                .tutorhubBankName
                                        }
                                        onChange={
                                            handleSettingsChange
                                        }
                                        placeholder="e.g. Capitec Bank"
                                        style={
                                            styles.input
                                        }
                                    />

                                </div>

                                <div>

                                    <label
                                        style={
                                            styles.label
                                        }
                                    >
                                        Account Holder
                                    </label>

                                    <input
                                        type="text"
                                        name="tutorhubAccountHolder"
                                        value={
                                            platformSettings
                                                .tutorhubAccountHolder
                                        }
                                        onChange={
                                            handleSettingsChange
                                        }
                                        placeholder="e.g. TutorHub"
                                        style={
                                            styles.input
                                        }
                                    />

                                </div>

                                <div>

                                    <label
                                        style={
                                            styles.label
                                        }
                                    >
                                        Account Number
                                    </label>

                                    <input
                                        type="text"
                                        name="tutorhubAccountNumber"
                                        value={
                                            platformSettings
                                                .tutorhubAccountNumber
                                        }
                                        onChange={
                                            handleSettingsChange
                                        }
                                        placeholder="Account number"
                                        style={
                                            styles.input
                                        }
                                    />

                                </div>

                                <div>

                                    <label
                                        style={
                                            styles.label
                                        }
                                    >
                                        Branch Code
                                    </label>

                                    <input
                                        type="text"
                                        name="tutorhubBranchCode"
                                        value={
                                            platformSettings
                                                .tutorhubBranchCode
                                        }
                                        onChange={
                                            handleSettingsChange
                                        }
                                        placeholder="Branch code"
                                        style={
                                            styles.input
                                        }
                                    />

                                </div>

                            </div>

                            <div
                                style={
                                    styles.bankStatus
                                }
                            >

                                <span>
                                    Banking details status
                                </span>

                                <strong>

                                    {
                                        platformSettings.tutorhubBankName &&
                                        platformSettings.tutorhubAccountHolder &&
                                        platformSettings.tutorhubAccountNumber &&
                                        platformSettings.tutorhubBranchCode
                                            ? "🟢 Configured"
                                            : "🔴 Details not configured"
                                    }

                                </strong>

                            </div>

                            <div
                                style={
                                    styles.adminProofSection
                                }
                            >

                                <div>

                                    <span
                                        style={
                                            styles.infoLabel
                                        }
                                    >
                                        Latest Owner Payment Proof
                                    </span>

                                    <strong>

                                        {
                                            platformSettings
                                                .tutorhubPaymentProof
                                                ? "Uploaded"
                                                : "No proof uploaded"
                                        }

                                    </strong>

                                </div>

                                {
                                    platformSettings
                                        .tutorhubPaymentProof && (

                                    <button
                                        style={
                                            styles.secondaryButton
                                        }
                                        onClick={() =>
                                            viewPaymentProof(
                                                platformSettings
                                                    .tutorhubPaymentProof
                                            )
                                        }
                                    >
                                        📄 View Proof
                                    </button>

                                )}

                            </div>

                        </div>

                        <div
                            style={
                                styles.previewBox
                            }
                        >

                            <span
                                style={
                                    styles.infoLabel
                                }
                            >
                                Colour Preview
                            </span>

                            <div
                                style={{
                                    ...styles.preview,
                                    background:
                                        platformSettings
                                            .secondaryColor
                                }}
                            >

                                <strong
                                    style={{
                                        color:
                                            platformSettings
                                                .primaryColor
                                    }}
                                >
                                    {
                                        platformSettings
                                            .platformName
                                    }
                                </strong>

                                <span>
                                    Your platform branding
                                </span>

                            </div>

                        </div>

                        <div
                            style={
                                styles.settingsActions
                            }
                        >

                            <button
                                style={
                                    styles.cancelButton
                                }
                                onClick={
                                    closeSettings
                                }
                                disabled={
                                    savingSettings
                                }
                            >
                                Cancel
                            </button>

                            <button
                                style={
                                    styles.saveButton
                                }
                                onClick={
                                    savePlatformSettings
                                }
                                disabled={
                                    savingSettings
                                }
                            >
                                {
                                    savingSettings
                                        ? "Saving..."
                                        : "💾 Save Changes"
                                }
                            </button>

                        </div>

                    </div>

                )}

                {/* =====================================
                    OVERVIEW
                ===================================== */}

                <div className="admin-stats-grid" style={styles.statsGrid}>

                    <div
                        style={
                            styles.statCard
                        }
                    >

                        <span
                            style={
                                styles.statIcon
                            }
                        >
                            🏫
                        </span>

                        <div>

                            <span
                                style={
                                    styles.statNumber
                                }
                            >
                                {
                                    programs.length
                                }
                            </span>

                            <span
                                style={
                                    styles.statLabel
                                }
                            >
                                Tuition Centres
                            </span>

                        </div>

                    </div>

                    <div
                        style={
                            styles.statCard
                        }
                    >

                        <span
                            style={
                                styles.statIcon
                            }
                        >
                            🟢
                        </span>

                        <div>

                            <span
                                style={
                                    styles.statNumber
                                }
                            >
                                {
                                    programs.filter(
                                        program =>
                                            program.status ===
                                            "Active"
                                    ).length
                                }
                            </span>

                            <span
                                style={
                                    styles.statLabel
                                }
                            >
                                Active Centres
                            </span>

                        </div>

                    </div>

                    <div
                        style={
                            styles.statCard
                        }
                    >

                        <span
                            style={
                                styles.statIcon
                            }
                        >
                            ⏳
                        </span>

                        <div>

                            <span
                                style={
                                    styles.statNumber
                                }
                            >
                                {
                                    programs.filter(
                                        program =>
                                            program.status ===
                                            "Pending"
                                    ).length
                                }
                            </span>

                            <span
                                style={
                                    styles.statLabel
                                }
                            >
                                Pending Approval
                            </span>

                        </div>

                    </div>

                    <div
                        style={
                            styles.statCard
                        }
                    >

                        <span
                            style={
                                styles.statIcon
                            }
                        >
                            🚫
                        </span>

                        <div>

                            <span
                                style={
                                    styles.statNumber
                                }
                            >
                                {
                                    programs.filter(
                                        program =>
                                            program.status ===
                                            "Blocked"
                                    ).length
                                }
                            </span>

                            <span
                                style={
                                    styles.statLabel
                                }
                            >
                                Blocked Centres
                            </span>

                        </div>

                    </div>

                </div>

                {/* =====================================
                    TUTORHUB PAYMENTS
                ===================================== */}

                <div
                    style={
                        styles.paymentsSection
                    }
                >

                    <div
                        style={
                            styles.sectionHeader
                        }
                    >

                        <div>

                            <p
                                style={
                                    styles.eyebrow
                                }
                            >
                                PLATFORM REVENUE
                            </p>

                            <h2
                                style={
                                    styles.sectionTitle
                                }
                            >
                                🏦 TutorHub Payments
                            </h2>

                            <p
                                style={
                                    styles.sectionDescription
                                }
                            >
                                Review subscription payments
                                submitted by tuition centre owners.
                            </p>

                        </div>

                        <button
                            style={
                                styles.refreshButton
                            }
                            onClick={
                                fetchOwnerPayments
                            }
                            disabled={
                                paymentsLoading
                            }
                        >
                            {
                                paymentsLoading
                                    ? "Refreshing..."
                                    : "🔄 Refresh"
                            }
                        </button>

                    </div>

                    <div
                        className="admin-payment-stats-grid" style={styles.paymentStatsGrid}>
                    

                        <div
                            style={
                                styles.paymentStatCard
                            }
                        >

                            <span
                                style={
                                    styles.paymentStatIcon
                                }
                            >
                                ⏳
                            </span>

                            <div>

                                <span
                                    style={
                                        styles.paymentStatNumber
                                    }
                                >
                                    {
                                        pendingPayments.length
                                    }
                                </span>

                                <span
                                    style={
                                        styles.paymentStatLabel
                                    }
                                >
                                    Pending Payments
                                </span>

                            </div>

                        </div>

                        <div
                            style={
                                styles.paymentStatCard
                            }
                        >

                            <span
                                style={
                                    styles.paymentStatIcon
                                }
                            >
                                🟢
                            </span>

                            <div>

                                <span
                                    style={
                                        styles.paymentStatNumber
                                    }
                                >
                                    {
                                        paidPayments.length
                                    }
                                </span>

                                <span
                                    style={
                                        styles.paymentStatLabel
                                    }
                                >
                                    Paid Payments
                                </span>

                            </div>

                        </div>

                        <div
                            style={
                                styles.paymentStatCard
                            }
                        >

                            <span
                                style={
                                    styles.paymentStatIcon
                                }
                            >
                                🔴
                            </span>

                            <div>

                                <span
                                    style={
                                        styles.paymentStatNumber
                                    }
                                >
                                    {
                                        rejectedPayments.length
                                    }
                                </span>

                                <span
                                    style={
                                        styles.paymentStatLabel
                                    }
                                >
                                    Rejected Payments
                                </span>

                            </div>

                        </div>

                        <div
                            style={
                                styles.paymentStatCard
                            }
                        >

                            <span
                                style={
                                    styles.paymentStatIcon
                                }
                            >
                                💰
                            </span>

                            <div>

                                <span
                                    style={
                                        styles.paymentStatNumber
                                    }
                                >
                                    R{
                                        totalPaid.toFixed(
                                            2
                                        )
                                    }
                                </span>

                                <span
                                    style={
                                        styles.paymentStatLabel
                                    }
                                >
                                    Total Paid
                                </span>

                            </div>

                        </div>

                    </div>

                    {
                        paymentsLoading ? (

                            <div
                                style={
                                    styles.paymentLoading
                                }
                            >

                                <div
                                    style={
                                        styles.paymentLoadingIcon
                                    }
                                >
                                    💳
                                </div>

                                <h3>
                                    Loading payments...
                                </h3>

                                <p>
                                    Fetching TutorHub payment
                                    submissions.
                                </p>

                            </div>

                        ) : ownerPayments.length ===
                            0 ? (

                            <div
                                style={
                                    styles.emptyPaymentState
                                }
                            >

                                <div
                                    style={
                                        styles.emptyIcon
                                    }
                                >
                                    💳
                                </div>

                                <h3>
                                    No TutorHub payments yet
                                </h3>

                                <p>
                                    Payments submitted by tuition
                                    centre owners will appear here.
                                </p>

                            </div>

                        ) : (

                            <div
                                style={
                                    styles.paymentList
                                }
                            >

                                {
                                    ownerPayments.map(
                                        payment => {

                                            const owner =
                                                payment.ownerId;

                                            const program =
                                                payment.programId;

                                            return (

                                                <div
                                                    key={
                                                        payment._id
                                                    }
                                                    style={
                                                        styles.paymentCard
                                                    }
                                                >

                                                    <div
                                                        style={
                                                            styles.paymentCardHeader
                                                        }
                                                    >

                                                        <div
                                                            style={
                                                                styles.paymentIdentity
                                                            }
                                                        >

                                                            <div
                                                                style={
                                                                    styles.paymentIcon
                                                                }
                                                            >
                                                                💳
                                                            </div>

                                                            <div>

                                                                <h3
                                                                    style={
                                                                        styles.paymentOwnerName
                                                                    }
                                                                >
                                                                    {
                                                                        owner
                                                                            ? `${owner.name || ""} ${owner.surname || ""}`.trim()
                                                                            : "Unknown Owner"
                                                                    }
                                                                </h3>

                                                                <p
                                                                    style={
                                                                        styles.paymentEmail
                                                                    }
                                                                >
                                                                    {
                                                                        owner?.email ||
                                                                        owner?.username ||
                                                                        "No contact details"
                                                                    }
                                                                </p>

                                                            </div>

                                                        </div>

                                                        <span
                                                            style={
                                                                payment.status ===
                                                                    "Paid"
                                                                    ? styles.paidBadge
                                                                    : payment.status ===
                                                                        "Rejected"
                                                                        ? styles.rejectedBadge
                                                                        : styles.paymentPendingBadge
                                                            }
                                                        >
                                                            {
                                                                payment.status ===
                                                                    "Paid"
                                                                    ? "🟢 Paid"
                                                                    : payment.status ===
                                                                        "Rejected"
                                                                        ? "🔴 Rejected"
                                                                        : "🟡 Pending"
                                                            }
                                                        </span>

                                                    </div>

                                                    <div
                                                       className="admin-payment-details-grid" style={styles.paymentDetailsGrid}>
                                                    

                                                        <div
                                                            style={
                                                                styles.paymentDetail
                                                            }
                                                        >

                                                            <span
                                                                style={
                                                                    styles.infoLabel
                                                                }
                                                            >
                                                                Tuition Centre
                                                            </span>

                                                            <strong>
                                                                {
                                                                    program?.name ||
                                                                    "Unknown Centre"
                                                                }
                                                            </strong>

                                                        </div>

                                                        <div
                                                            style={
                                                                styles.paymentDetail
                                                            }
                                                        >

                                                            <span
                                                                style={
                                                                    styles.infoLabel
                                                                }
                                                            >
                                                                Payment Period
                                                            </span>

                                                            <strong>
                                                                {
                                                                    payment.month ||
                                                                    "—"
                                                                }{" "}
                                                                {
                                                                    payment.year ||
                                                                    ""
                                                                }
                                                            </strong>

                                                        </div>

                                                        <div
                                                            style={
                                                                styles.paymentDetail
                                                            }
                                                        >

                                                            <span
                                                                style={
                                                                    styles.infoLabel
                                                                }
                                                            >
                                                                Amount Paid
                                                            </span>

                                                            <strong
                                                                style={
                                                                    styles.amountText
                                                                }
                                                            >
                                                                R{
                                                                    Number(
                                                                        payment.amount ||
                                                                        0
                                                                    ).toFixed(
                                                                        2
                                                                    )
                                                                }
                                                            </strong>

                                                        </div>

                                                        <div
                                                            style={
                                                                styles.paymentDetail
                                                            }
                                                        >

                                                            <span
                                                                style={
                                                                    styles.infoLabel
                                                                }
                                                            >
                                                                Submitted
                                                            </span>

                                                            <strong>
                                                                {
                                                                    formatPaymentDate(
                                                                        payment.createdAt
                                                                    )
                                                                }
                                                            </strong>

                                                        </div>

                                                    </div>

                                                    <div
                                                        style={
                                                            styles.paymentProofRow
                                                        }
                                                    >

                                                        <div>

                                                            <span
                                                                style={
                                                                    styles.infoLabel
                                                                }
                                                            >
                                                                Payment Proof
                                                            </span>

                                                            <strong>
                                                                {
                                                                    payment.proof
                                                                        ? "📄 Proof uploaded"
                                                                        : "No proof uploaded"
                                                                }
                                                            </strong>

                                                        </div>

                                                        <div
                                                            style={
                                                                styles.paymentActions
                                                            }
                                                        >

                                                            <button
                                                                style={
                                                                    payment.proof
                                                                        ? styles.secondaryButton
                                                                        : styles.disabledButton
                                                                }
                                                                disabled={
                                                                    !payment.proof
                                                                }
                                                                onClick={() =>
                                                                    viewPaymentProof(
                                                                        payment.proof
                                                                    )
                                                                }
                                                            >
                                                                📄 View Proof
                                                            </button>

                                                            {
                                                                payment.status ===
                                                                    "Pending" && (

                                                                    <>

                                                                        <button
                                                                            style={
                                                                                styles.paymentApproveButton
                                                                            }
                                                                            onClick={() =>
                                                                                approveOwnerPayment(
                                                                                    payment._id
                                                                                )
                                                                            }
                                                                        >
                                                                            ✅ Approve
                                                                        </button>

                                                                        <button
                                                                            style={
                                                                                styles.paymentRejectButton
                                                                            }
                                                                            onClick={() =>
                                                                                rejectOwnerPayment(
                                                                                    payment._id
                                                                                )
                                                                            }
                                                                        >
                                                                            ❌ Reject
                                                                        </button>

                                                                    </>

                                                                )
                                                            }

                                                        </div>

                                                    </div>

                                                </div>

                                            );

                                        }
                                    )
                                }

                            </div>

                        )
                    }

                </div>

                {/* =====================================
                    TUITION CENTRES
                ===================================== */}

                <div
                    style={
                        styles.section
                    }
                >

                    <div
                        style={
                            styles.sectionHeader
                        }
                    >

                        <div>

                            <h2
                                style={
                                    styles.sectionTitle
                                }
                            >
                                🏫 Tuition Centres
                            </h2>

                            <p
                                style={
                                    styles.sectionDescription
                                }
                            >
                                View centre subscriptions,
                                payment proofs and platform usage.
                            </p>

                        </div>

                        <span
                            style={
                                styles.countBadge
                            }
                        >
                            {
                                programs.length
                            }
                        </span>

                    </div>

                    {
                        programs.length ===
                            0 ? (

                            <div
                                style={
                                    styles.emptyState
                                }
                            >

                                <div
                                    style={
                                        styles.emptyIcon
                                    }
                                >
                                    🏫
                                </div>

                                <h3>
                                    No tuition centres
                                </h3>

                                <p>
                                    Registered tuition centres
                                    will appear here.
                                </p>

                            </div>

                        ) : (

                            <div
                                style={
                                    styles.grid
                                }
                            >

                                {
                                    programs.map(
                                        program => {

                                            const owner =
                                                program.owner ||
                                                program.ownerId;

                                            return (

                                                <div
                                                    key={
                                                        program._id
                                                    }
                                                    style={
                                                        styles.card
                                                    }
                                                >

                                                    <div
                                                        style={
                                                            styles.cardHeader
                                                        }
                                                    >

                                                        <div
                                                            style={
                                                                styles.centreIcon
                                                            }
                                                        >
                                                            🏫
                                                        </div>

                                                        <div
                                                            style={{
                                                                flex: 1
                                                            }}
                                                        >

                                                            <h3
                                                                style={
                                                                    styles.centreName
                                                                }
                                                            >
                                                                {
                                                                    program.name
                                                                }
                                                            </h3>

                                                            <span
                                                                style={
                                                                    program.status ===
                                                                        "Active"
                                                                        ? styles.activeBadge
                                                                        : program.status ===
                                                                            "Blocked"
                                                                            ? styles.blockedBadge
                                                                            : styles.pendingBadge
                                                                }
                                                            >
                                                                {
                                                                    program.status
                                                                }
                                                            </span>

                                                        </div>

                                                    </div>

                                                    <div
                                                        style={
                                                            styles.infoSection
                                                        }
                                                    >

                                                        <span
                                                            style={
                                                                styles.infoLabel
                                                            }
                                                        >
                                                            Centre Owner
                                                        </span>

                                                        <strong>
                                                            {
                                                                owner
                                                                    ? `${owner.name || ""} ${owner.surname || ""}`.trim()
                                                                    : "Unknown"
                                                            }
                                                        </strong>

                                                        {
                                                            owner?.email && (

                                                                <small
                                                                    style={
                                                                        styles.muted
                                                                    }
                                                                >
                                                                    {
                                                                        owner.email
                                                                    }
                                                                </small>

                                                            )
                                                        }

                                                    </div>

                                                    <div
                                                        style={
                                                            styles.statsRow
                                                        }
                                                    >

                                                        <div
                                                            style={
                                                                styles.smallStat
                                                            }
                                                        >

                                                            <span
                                                                style={
                                                                    styles.smallStatNumber
                                                                }
                                                            >
                                                                {
                                                                    program.learnerCount ??
                                                                    0
                                                                }
                                                            </span>

                                                            <span
                                                                style={
                                                                    styles.smallStatLabel
                                                                }
                                                            >
                                                                Learners
                                                            </span>

                                                        </div>

                                                        <div
                                                            style={
                                                                styles.smallStat
                                                            }
                                                        >

                                                            <span
                                                                style={
                                                                    styles.smallStatNumber
                                                                }
                                                            >
                                                                {
                                                                    program.tutorCount ??
                                                                    0
                                                                }
                                                            </span>

                                                            <span
                                                                style={
                                                                    styles.smallStatLabel
                                                                }
                                                            >
                                                                Tutors
                                                            </span>

                                                        </div>

                                                    </div>

                                                    <div
                                                        style={
                                                            styles.subscriptionBox
                                                        }
                                                    >

                                                        <div>

                                                            <span
                                                                style={
                                                                    styles.infoLabel
                                                                }
                                                            >
                                                                Subscription
                                                            </span>

                                                            <strong>
                                                                {
                                                                    program.subscriptionStatus ||
                                                                    "—"
                                                                }
                                                            </strong>

                                                        </div>

                                                        <div>

                                                            <span
                                                                style={
                                                                    styles.infoLabel
                                                                }
                                                            >
                                                                Monthly Fee
                                                            </span>

                                                            <strong>
                                                                R{
                                                                    Number(
                                                                        program.monthlyFee ||
                                                                        0
                                                                    ).toFixed(
                                                                        2
                                                                    )
                                                                }
                                                            </strong>

                                                        </div>

                                                    </div>

                                                    <div
                                                        style={
                                                            styles.paymentSection
                                                        }
                                                    >

                                                        <div>

                                                            <span
                                                                style={
                                                                    styles.infoLabel
                                                                }
                                                            >
                                                                Payment Proof
                                                            </span>

                                                            <strong>
                                                                {
                                                                    program.paymentProof
                                                                        ? "Uploaded"
                                                                        : "Not uploaded"
                                                                }
                                                            </strong>

                                                        </div>

                                                        <button
                                                            style={
                                                                program.paymentProof
                                                                    ? styles.secondaryButton
                                                                    : styles.disabledButton
                                                            }
                                                            disabled={
                                                                !program.paymentProof
                                                            }
                                                            onClick={() =>
                                                                viewPaymentProof(
                                                                    program.paymentProof
                                                                )
                                                            }
                                                        >
                                                            📄 View Proof
                                                        </button>

                                                    </div>

                                                    <div
                                                        style={
                                                            styles.actions
                                                        }
                                                    >

                                                        {
                                                            program.status ===
                                                                "Pending" && (

                                                                <button
                                                                    style={
                                                                        styles.approveButton
                                                                    }
                                                                    onClick={() =>
                                                                        approveProgram(
                                                                            program._id
                                                                        )
                                                                    }
                                                                >
                                                                    ✅ Approve
                                                                </button>

                                                            )
                                                        }

                                                        {
                                                            program.status ===
                                                                "Active" && (

                                                                <button
                                                                    style={
                                                                        styles.blockButton
                                                                    }
                                                                    onClick={() =>
                                                                        blockProgram(
                                                                            program._id
                                                                        )
                                                                    }
                                                                >
                                                                    🚫 Block Centre
                                                                </button>

                                                            )
                                                        }

                                                        {
                                                            program.status ===
                                                                "Blocked" && (

                                                                <button
                                                                    style={
                                                                        styles.unblockButton
                                                                    }
                                                                    onClick={() =>
                                                                        unblockProgram(
                                                                            program._id
                                                                        )
                                                                    }
                                                                >
                                                                    🔓 Unblock Centre
                                                                </button>

                                                            )
                                                        }

                                                        <button
                                                            style={
                                                                styles.deleteButton
                                                            }
                                                            onClick={() =>
                                                                deleteProgram(
                                                                    program._id,
                                                                    program.name
                                                                )
                                                            }
                                                        >
                                                            🗑️ Delete Centre
                                                        </button>

                                                    </div>

                                                </div>

                                            );

                                        }
                                    )
                                }

                            </div>

                        )
                    }

                </div>

            </div>

        </div>

    );

}


// =====================================================
// STYLES
// =====================================================

const styles = {

    page: {
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "35px 20px",
        boxSizing: "border-box"
    },

    container: {
        maxWidth: "1250px",
        margin: "0 auto"
    },

    loadingCard: {
        maxWidth: "500px",
        margin: "120px auto",
        background: "#ffffff",
        padding: "50px",
        borderRadius: "20px",
        textAlign: "center",
        boxShadow:
            "0 8px 30px rgba(0,0,0,0.07)"
    },

    loadingIcon: {
        fontSize: "45px"
    },

    header: {
        background: "#ffffff",
        borderRadius: "20px",
        padding: "30px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "20px",
        marginBottom: "18px",
        boxShadow:
            "0 8px 30px rgba(0,0,0,0.07)"
    },

    headerActions: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexWrap: "wrap",
        justifyContent: "flex-end"
    },

    eyebrow: {
        margin: "0 0 6px",
        fontSize: "11px",
        fontWeight: "800",
        letterSpacing: "1.5px",
        opacity: 0.55
    },

    title: {
        margin: 0,
        fontSize: "30px"
    },

    subtitle: {
        margin: "8px 0 0",
        fontSize: "14px",
        opacity: 0.65
    },

    settingsButton: {
        border: "1px solid #d9dee8",
        background: "#ffffff",
        color: "#111827",
        padding: "11px 16px",
        borderRadius: "9px",
        cursor: "pointer",
        fontWeight: "700"
    },

    changePasswordButton: {
        border: "1px solid #d9dee8",
        background: "#f7f8fb",
        color: "#111827",
        padding: "11px 16px",
        borderRadius: "9px",
        cursor: "pointer",
        fontWeight: "700"
    },

    logoutButton: {
        border: "1px solid #ead2d2",
        background: "#fff7f7",
        color: "#a33a3a",
        padding: "11px 18px",
        borderRadius: "9px",
        cursor: "pointer",
        fontWeight: "700"
    },

    settingsCard: {
        background: "#ffffff",
        borderRadius: "20px",
        padding: "30px",
        marginBottom: "18px",
        boxShadow:
            "0 8px 30px rgba(0,0,0,0.06)",
        border:
            "1px solid #e7eaf0"
    },

    settingsHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "20px",
        marginBottom: "25px"
    },

    settingsTitle: {
        margin: 0,
        fontSize: "23px"
    },

    settingsDescription: {
        margin: "7px 0 0",
        fontSize: "13px",
        opacity: 0.6
    },

    closeButton: {
        border: "none",
        background: "#f5f6f8",
        width: "35px",
        height: "35px",
        borderRadius: "9px",
        cursor: "pointer",
        fontWeight: "700",
        fontSize: "15px"
    },

    formGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "18px"
    },

    loginChangeCard: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "18px",
        background: "#f7f8fb",
        border: "1px solid #e4e7ee",
        borderRadius: "15px",
        padding: "22px"
    },

    loginField: {
        display: "flex",
        flexDirection: "column"
    },

    label: {
        display: "block",
        marginBottom: "7px",
        fontSize: "12px",
        fontWeight: "800"
    },

    input: {
        width: "100%",
        boxSizing: "border-box",
        padding: "12px 14px",
        border:
            "1px solid #d9dee8",
        borderRadius: "10px",
        fontSize: "14px",
        background: "#ffffff",
        outline: "none"
    },

    securityNotice: {
        marginTop: "18px",
        padding: "15px 17px",
        background: "#fff8e8",
        border: "1px solid #f0dfb0",
        borderRadius: "11px",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px"
    },

    securityIcon: {
        fontSize: "22px"
    },

    securityText: {
        margin: "4px 0 0",
        fontSize: "12px",
        lineHeight: 1.5,
        opacity: 0.7
    },

    colorInputRow: {
        display: "flex",
        alignItems: "center",
        gap: "10px"
    },

    colorPicker: {
        width: "52px",
        height: "42px",
        padding: "3px",
        border:
            "1px solid #d9dee8",
        borderRadius: "9px",
        background: "#ffffff",
        cursor: "pointer"
    },

    colorTextInput: {
        flex: 1,
        padding: "12px 14px",
        border:
            "1px solid #d9dee8",
        borderRadius: "10px",
        fontSize: "14px",
        background: "#ffffff",
        outline: "none"
    },

    bankCard: {
        marginTop: "28px",
        padding: "24px",
        borderRadius: "16px",
        background: "#f7f8fb",
        border:
            "1px solid #e4e7ee"
    },

    bankTitle: {
        margin: "3px 0 6px",
        fontSize: "21px"
    },

    bankDescription: {
        margin: "0 0 20px",
        fontSize: "13px",
        opacity: 0.65
    },

    bankStatus: {
        marginTop: "20px",
        padding: "13px 15px",
        background: "#ffffff",
        borderRadius: "10px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "10px"
    },

    adminProofSection: {
        marginTop: "12px",
        padding: "14px",
        background: "#ffffff",
        borderRadius: "10px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "10px"
    },

    previewBox: {
        marginTop: "25px",
        paddingTop: "20px",
        borderTop:
            "1px solid #edf0f4"
    },

    preview: {
        marginTop: "8px",
        padding: "18px",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "15px"
    },

    settingsActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "9px",
        marginTop: "25px"
    },

    cancelButton: {
        border:
            "1px solid #d9dee8",
        background: "#ffffff",
        padding: "11px 17px",
        borderRadius: "9px",
        cursor: "pointer",
        fontWeight: "700"
    },

    saveButton: {
        border: "none",
        background: "#111827",
        color: "#ffffff",
        padding: "11px 18px",
        borderRadius: "9px",
        cursor: "pointer",
        fontWeight: "700"
    },

    saveLoginButton: {
        border: "none",
        background: "#111827",
        color: "#ffffff",
        padding: "11px 18px",
        borderRadius: "9px",
        cursor: "pointer",
        fontWeight: "700"
    },

    statsGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(4, 1fr)",
        gap: "14px",
        marginBottom: "18px"
    },

    statCard: {
        background: "#ffffff",
        borderRadius: "16px",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        boxShadow:
            "0 6px 22px rgba(0,0,0,0.05)"
    },

    statIcon: {
        fontSize: "26px"
    },

    statNumber: {
        display: "block",
        fontSize: "23px",
        fontWeight: "800"
    },

    statLabel: {
        display: "block",
        fontSize: "12px",
        opacity: 0.6,
        marginTop: "2px"
    },

    paymentsSection: {
        background: "#ffffff",
        borderRadius: "20px",
        padding: "30px",
        marginBottom: "18px",
        boxShadow:
            "0 8px 30px rgba(0,0,0,0.06)",
        border:
            "1px solid #e7eaf0"
    },

    refreshButton: {
        border:
            "1px solid #d9dee8",
        background: "#ffffff",
        padding: "10px 14px",
        borderRadius: "9px",
        cursor: "pointer",
        fontWeight: "700"
    },

    paymentStatsGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(4, 1fr)",
        gap: "12px",
        marginBottom: "22px"
    },

    paymentStatCard: {
        background: "#f7f8fb",
        borderRadius: "13px",
        padding: "16px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        border:
            "1px solid #e7eaf0"
    },

    paymentStatIcon: {
        fontSize: "23px"
    },

    paymentStatNumber: {
        display: "block",
        fontSize: "19px",
        fontWeight: "800"
    },

    paymentStatLabel: {
        display: "block",
        fontSize: "10px",
        opacity: 0.6,
        marginTop: "2px"
    },

    paymentList: {
        display: "flex",
        flexDirection: "column",
        gap: "13px"
    },

    paymentCard: {
        border:
            "1px solid #e3e7ee",
        borderRadius: "15px",
        padding: "20px",
        background: "#ffffff"
    },

    paymentCardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        marginBottom: "18px"
    },

    paymentIdentity: {
        display: "flex",
        alignItems: "center",
        gap: "12px"
    },

    paymentIcon: {
        width: "45px",
        height: "45px",
        borderRadius: "12px",
        background: "#eef2ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "21px"
    },

    paymentOwnerName: {
        margin: 0,
        fontSize: "17px"
    },

    paymentEmail: {
        margin: "4px 0 0",
        fontSize: "12px",
        opacity: 0.55
    },

    paidBadge: {
        background: "#e8f8ee",
        color: "#17723c",
        padding: "6px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: "800"
    },

    rejectedBadge: {
        background: "#fff0f0",
        color: "#a33a3a",
        padding: "6px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: "800"
    },

    paymentPendingBadge: {
        background: "#fff6df",
        color: "#946b00",
        padding: "6px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: "800"
    },

    paymentDetailsGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(4, 1fr)",
        gap: "10px",
        marginBottom: "17px"
    },

    paymentDetail: {
        background: "#f7f8fb",
        borderRadius: "10px",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        minWidth: 0
    },

    amountText: {
        color: "#17723c"
    },

    paymentProofRow: {
        borderTop:
            "1px solid #edf0f4",
        paddingTop: "15px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px"
    },

    paymentActions: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap",
        justifyContent: "flex-end"
    },

    paymentApproveButton: {
        border: "none",
        background: "#17723c",
        color: "#ffffff",
        padding: "9px 13px",
        borderRadius: "9px",
        cursor: "pointer",
        fontWeight: "700",
        fontSize: "12px"
    },

    paymentRejectButton: {
        border:
            "1px solid #f0d0d0",
        background: "#fff7f7",
        color: "#a33a3a",
        padding: "9px 13px",
        borderRadius: "9px",
        cursor: "pointer",
        fontWeight: "700",
        fontSize: "12px"
    },

    paymentLoading: {
        border:
            "1px dashed #d7dce5",
        borderRadius: "15px",
        padding: "45px 20px",
        textAlign: "center",
        background: "#fafbfc"
    },

    paymentLoadingIcon: {
        fontSize: "35px"
    },

    emptyPaymentState: {
        border:
            "1px dashed #d7dce5",
        borderRadius: "15px",
        padding: "50px 20px",
        textAlign: "center",
        background: "#fafbfc"
    },

    section: {
        background: "#ffffff",
        borderRadius: "20px",
        padding: "30px",
        boxShadow:
            "0 8px 30px rgba(0,0,0,0.06)"
    },

    sectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "25px"
    },

    sectionTitle: {
        margin: 0,
        fontSize: "23px"
    },

    sectionDescription: {
        margin: "7px 0 0",
        fontSize: "13px",
        opacity: 0.6
    },

    countBadge: {
        background: "#eef2ff",
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: "700"
    },

    grid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
        gap: "18px"
    },

    card: {
        border:
            "1px solid #e5e8ef",
        borderRadius: "17px",
        padding: "21px",
        background: "#ffffff",
        boxShadow:
            "0 4px 15px rgba(0,0,0,0.035)"
    },

    cardHeader: {
        display: "flex",
        alignItems: "flex-start",
        gap: "13px",
        marginBottom: "20px"
    },

    centreIcon: {
        width: "48px",
        height: "48px",
        borderRadius: "13px",
        background: "#eef2ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "23px"
    },

    centreName: {
        margin: "0 0 6px",
        fontSize: "18px"
    },

    activeBadge: {
        display: "inline-block",
        background: "#e8f8ee",
        color: "#17723c",
        padding: "5px 9px",
        borderRadius: "20px",
        fontSize: "10px",
        fontWeight: "800"
    },

    pendingBadge: {
        display: "inline-block",
        background: "#fff6df",
        color: "#946b00",
        padding: "5px 9px",
        borderRadius: "20px",
        fontSize: "10px",
        fontWeight: "800"
    },

    blockedBadge: {
        display: "inline-block",
        background: "#fff0f0",
        color: "#a33a3a",
        padding: "5px 9px",
        borderRadius: "20px",
        fontSize: "10px",
        fontWeight: "800"
    },

    infoSection: {
        display: "flex",
        flexDirection: "column",
        gap: "3px",
        marginBottom: "15px"
    },

    infoLabel: {
        fontSize: "10px",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        opacity: 0.5,
        fontWeight: "800"
    },

    muted: {
        fontSize: "12px",
        opacity: 0.6
    },

    statsRow: {
        display: "grid",
        gridTemplateColumns:
            "1fr 1fr",
        gap: "9px",
        marginBottom: "12px"
    },

    smallStat: {
        background: "#f7f8fb",
        borderRadius: "11px",
        padding: "13px",
        display: "flex",
        flexDirection: "column",
        gap: "3px"
    },

    smallStatNumber: {
        fontSize: "21px",
        fontWeight: "800"
    },

    smallStatLabel: {
        fontSize: "11px",
        opacity: 0.6
    },

    subscriptionBox: {
        display: "grid",
        gridTemplateColumns:
            "1fr 1fr",
        gap: "10px",
        background: "#f7f8fb",
        borderRadius: "11px",
        padding: "13px",
        marginBottom: "12px"
    },

    paymentSection: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        borderTop:
            "1px solid #edf0f4",
        paddingTop: "15px"
    },

    secondaryButton: {
        border:
            "1px solid #d9dee8",
        background: "#ffffff",
        padding: "9px 13px",
        borderRadius: "9px",
        cursor: "pointer",
        fontWeight: "700",
        fontSize: "12px"
    },

    disabledButton: {
        border:
            "1px solid #e5e7eb",
        background: "#f5f5f5",
        color: "#999999",
        padding: "9px 13px",
        borderRadius: "9px",
        cursor: "not-allowed",
        fontWeight: "700",
        fontSize: "12px"
    },

    actions: {
        display: "flex",
        gap: "8px",
        marginTop: "17px",
        flexWrap: "wrap"
    },

    approveButton: {
        flex: 1,
        border: "none",
        background: "#17723c",
        color: "#ffffff",
        padding: "11px",
        borderRadius: "9px",
        cursor: "pointer",
        fontWeight: "700"
    },

    blockButton: {
        flex: 1,
        border:
            "1px solid #f0d0d0",
        background: "#fff7f7",
        color: "#a33a3a",
        padding: "11px",
        borderRadius: "9px",
        cursor: "pointer",
        fontWeight: "700"
    },

    unblockButton: {
        flex: 1,
        border: "none",
        background: "#111827",
        color: "#ffffff",
        padding: "11px",
        borderRadius: "9px",
        cursor: "pointer",
        fontWeight: "700"
    },

    deleteButton: {
        flex: 1,
        border:
            "1px solid #f0caca",
        background: "#fff0f0",
        color: "#b42323",
        padding: "11px",
        borderRadius: "9px",
        cursor: "pointer",
        fontWeight: "700"
    },

    emptyState: {
        border:
            "1px dashed #d7dce5",
        borderRadius: "16px",
        padding: "60px 20px",
        textAlign: "center",
        background: "#fafbfc"
    },

    emptyIcon: {
        fontSize: "42px",
        marginBottom: "10px"
    }

};

export default Admin;
