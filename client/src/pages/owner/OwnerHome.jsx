import { useNavigate } from "react-router-dom";

import DashboardBox from "../../components/DashboardBox";


function OwnerHome() {


    const navigate =
        useNavigate();


    return (


        <div>


            <h1>
                TutorHub Owner Dashboard 🚀
            </h1>


            <p>
                Manage your tuition centre from here.
            </p>


            <div

                style={{

                    display: "flex",

                    gap: "20px",

                    flexWrap: "wrap"

                }}

            >


                {/* =====================================
                    TEACHERS
                ===================================== */}

                <DashboardBox

                    icon="👨‍🏫"

                    title="Teachers"

                    description="Manage your teachers"

                    onClick={() =>
                        navigate(
                            "/owner-teachers"
                        )
                    }

                />


                {/* =====================================
                    LEARNERS
                ===================================== */}

                <DashboardBox

                    icon="📚"

                    title="Learners"

                    description="Manage learners"

                    onClick={() =>
                        navigate(
                            "/owner-learners"
                        )
                    }

                />


                {/* =====================================
                    LEARNER PAYMENTS
                ===================================== */}

                <DashboardBox

                    icon="💳"

                    title="Payments"

                    description="Manage tuition payments"

                    onClick={() =>
                        navigate(
                            "/owner-payments"
                        )
                    }

                />


                {/* =====================================
                    PAY TUTORHUB
                ===================================== */}
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

                {/* =====================================
                    REPORTS
                ===================================== */}

                <DashboardBox

                    icon="📊"

                    title="Reports"

                    description="View tuition reports"

                    onClick={() =>
                        navigate(
                            "/owner-reports"
                        )
                    }

                />


                {/* =====================================
                    SETTINGS
                ===================================== */}

                <DashboardBox

                    icon="⚙️"

                    title="Settings"

                    description="Manage tuition settings"

                    onClick={() =>
                        navigate(
                            "/owner-settings"
                        )
                    }

                />


            </div>


        </div>


    );


}


export default OwnerHome;