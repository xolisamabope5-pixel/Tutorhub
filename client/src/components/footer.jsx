import { Link } from "react-router-dom";
import "./footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-box">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="footer-brand-link">
              <span className="footer-logo-mark">T</span>
              <span className="footer-logo">TutorHub</span>
            </Link>
            <p className="footer-company">A learning platform by <strong>Solethu Labs</strong></p>
            <p className="footer-description">A simpler way for independent tutors, tuition centres and learners to teach, learn and stay organised.</p>
          </div>
          <div className="footer-links">
            <h4>Explore</h4>
            <Link to="/">Home</Link>
            <Link to="/login">Learner login</Link>
            <Link to="/tutor-login">Tutor login</Link>
            <Link to="/register">Learner registration</Link>
            <Link to="/tutor-register">Provider registration</Link>
          </div>
          <div className="footer-links">
            <h4>Your workspace</h4>
            <Link to="/inbox">Inbox</Link>
            <Link to="/learner-dashboard">Learner dashboard</Link>
            <Link to="/tutor-dashboard">Tutor dashboard</Link>
            <Link to="/admin-login">Platform administration</Link>
          </div>
          <div className="footer-company-section">
            <h4>Built by</h4>
            <div className="footer-solethu">Solethu Labs</div>
            <p>We don’t just build software; we find a problem and solve it.</p>
            <span className="footer-status"><i /> Made for better learning</span>
          </div>
        </div>
        <div className="footer-divider" />
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} <strong>TutorHub</strong>. All rights reserved.</p>
          <p>Designed and developed by <strong>Solethu Labs (Pty) Ltd</strong></p>
        </div>
      </div>
    </footer>
  );
}
