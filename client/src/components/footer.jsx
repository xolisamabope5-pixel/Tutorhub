
import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {

    return (

        <footer className="footer">

            <div className="footer-box">

                {/* =====================================
                    TOP SECTION
                ===================================== */}

                <div className="footer-top">


                    {/* BRAND */}

                    <div className="footer-brand">

                        <Link
                            to="/"
                            className="footer-brand-link"
                        >

                            <div className="footer-logo-box">

                                <div className="footer-logo">
                                    TutorHub
                                </div>

                                <div className="footer-company">
                                    by <strong>Solethu Labs</strong>
                                </div>

                            </div>

                        </Link>


                        <p className="footer-description">
                            Smart tuition management made
                            simple for tuition centres,
                            tutors and learners.
                        </p>

                    </div>


                    {/* PLATFORM LINKS */}

                    <div className="footer-links">

                        <h4>
                            Platform
                        </h4>


                        <Link to="/">
                            Home
                        </Link>


                        <Link to="/login">
                            Learner Login
                        </Link>


                        <Link to="/tutor-login">
                            Tutor Login
                        </Link>


                        <Link to="/register">
                            Learner Register
                        </Link>


                        <Link to="/tutor-register">
                            Tutor Register
                        </Link>

                    </div>


                    {/* COMPANY */}

                    <div className="footer-company-section">

                        <h4>
                            Built by
                        </h4>

                        <div className="footer-solethu">
                            Solethu Labs
                        </div>

                        <p>
                            Technology that turns ideas
                            into real products.
                        </p>

                    </div>

                </div>


                {/* =====================================
                    DIVIDER
                ===================================== */}

                <div className="footer-divider"></div>


                {/* =====================================
                    BOTTOM
                ===================================== */}

                <div className="footer-bottom">

                    <p>
                        © 2026 <strong>TutorHub</strong>.
                        All rights reserved.
                    </p>


                    <p>
                        A product of{" "}
                        <strong>
                            Solethu Labs
                        </strong>
                    </p>

                </div>

            </div>

        </footer>

    );

}

export default Footer;

