import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import OwnerTutorHubPayment from "./pages/owner/OwnerTutorHubPayment";
import TutorClassroom from "./pages/TutorClassroom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import Login from "./pages/login";
import TutorMaterials from "./pages/TutorMaterials";
import Navbar from "./components/Navbar";
import Footer from "./components/footer";
import TutorSubmissions from "./pages/TutorSubmissions";
import TutorDocumentSubmissions from "./pages/TutorDocumentSubmissions";
import LearnerDashboard from "./pages/LearnerDashboard";
import TeacherClasses from "./pages/owner/TeacherClasses";
import TutorRegister from "./pages/TutorRegister";
import TutorLogin from "./pages/TutorLogin";
import TutorDashboard from "./pages/TutorDashboard";
import LearnerAssignment from "./pages/learner/LearnerAssignment";
import LearnerDocumentAssignment from "./pages/learner/LearnerDocumentAssignment";
import Classroom from "./pages/Classroom";
import TutorMarkSubmission from "./pages/TutorMarkSubmission";
import CreateClass from "./pages/CreateClass";
import ManageTeacher from "./pages/ManageTeacher";
import InAppResourceViewer from "./components/InAppResourceViewer";
import DashboardSidebar from "./components/DashboardSidebar";
import Inbox from "./pages/Inbox";
import Attendance from "./pages/Attendance";



// Learner pages

import MyClasses from "./pages/learner/MyClasses";
import Assignments from "./pages/learner/Assignments";
import Lessons from "./pages/learner/Lessons";
import Announcements from "./pages/learner/Announcements";
import Payments from "./pages/learner/Payments";
import Profile from "./pages/learner/Profile";
import BrowseClasses from "./pages/learner/BrowseClasses";
import LearnerResults from "./pages/learner/Results";



// Owner pages

import ManageLearner from "./pages/owner/ManageLearner";
import LearnerPayments from "./pages/owner/LearnerPayments";
import OwnerHome from "./pages/owner/OwnerHome";
import Teachers from "./pages/owner/Teachers";
import Learners from "./pages/owner/Learners";
import OwnerPayments from "./pages/owner/Payments";
import Reports from "./pages/owner/Reports";
import OwnerSettings from "./pages/owner/OwnerSettings";
import OwnerMyClasses from "./pages/owner/OwnerMyClasses";





function AppContent() {
    const location = useLocation();
    const path = location.pathname;
    const savedTutorRole = (() => { try { return JSON.parse(localStorage.getItem("tutor") || "{}").role; } catch { return null; } })();
    const inboxSession = path === "/inbox" ? (() => { try { return localStorage.getItem("learner") ? "learner" : localStorage.getItem("adminLoggedIn") === "true" ? "admin" : (() => { try { return JSON.parse(localStorage.getItem("tutor") || "{}").role === "owner" ? "owner" : "tutor"; } catch { return "tutor"; } })(); } catch { return "learner"; } })() : null;
    const sidebarRole = path === "/admin" ? null : path === "/attendance" ? (() => { try { return JSON.parse(localStorage.getItem("tutor") || "{}").role === "owner" ? "owner" : "tutor"; } catch { return "tutor"; } })() : path === "/inbox" ? inboxSession : path.startsWith("/admin") && path !== "/admin-login" ? "admin"
        : (path.startsWith("/owner") || path.startsWith("/teacher-classes") || path.startsWith("/manage-learner") || path.startsWith("/manage-teacher") || path.startsWith("/owner-payment")) ? "owner"
        : ((path.startsWith("/tutor-") && !["/tutor-login", "/tutor-register"].includes(path)) || path === "/create-class" || path.startsWith("/mark-submission")) ? (savedTutorRole === "owner" && (path === "/create-class" || path.startsWith("/tutor-classroom/")) ? "owner" : "tutor")
        : path.startsWith("/learner") ? "learner" : path.startsWith("/classroom") ? (savedTutorRole === "owner" ? "owner" : localStorage.getItem("tutor") ? "tutor" : "learner") : null;

const isWorkspace = Boolean(sidebarRole) || path === "/admin";

return (

<div className={sidebarRole ? "th-app-with-sidebar" : isWorkspace ? "th-app th-admin-app" : "th-app"}>

{sidebarRole && <DashboardSidebar role={sidebarRole} />}
<InAppResourceViewer />
{!isWorkspace && <Navbar />}


<Routes>
<Route path="/inbox" element={<Inbox />} />
<Route path="/attendance" element={<Attendance />} />



<Route
path="/teacher-classes/:id"
element={<TeacherClasses />}
/>



<Route
path="/manage-learner/:id"
element={<ManageLearner/>}
/>



<Route
path="/tutor-materials/:id"
element={<TutorMaterials />}
/>





<Route
path="/learner/assignment/:id"
element={<LearnerAssignment />}
/>

<Route
path="/learner/document-assignment/:id"
element={<LearnerDocumentAssignment />}
/>


<Route
    path="/owner/tutorhub-payment"
    element={<OwnerTutorHubPayment />}
/>


<Route path="/tutor-submissions/:id" element={<TutorSubmissions/>} />
<Route path="/tutor-document-submissions/:id" element={<TutorDocumentSubmissions/>} />







<Route
path="/tutor-classroom/:id"
element={<TutorClassroom />}
/>







{/* Tutor marking submission */}

<Route
path="/mark-submission/:id"
element={<TutorMarkSubmission />}
/>



<Route
path="/tutor/mark-submission/:id"
element={<TutorMarkSubmission />}
/>








<Route
path="/owner-dashboard"
element={<OwnerHome />}
/>




<Route
path="/create-class"
element={<CreateClass/>}
/>




<Route
path="/owner-payment/:id"
element={<LearnerPayments />}
/>




<Route
path="/manage-teacher/:id"
element={<ManageTeacher/>}
/>









{/* Learner pages */}


<Route
path="/learner/classes"
element={<MyClasses />}
/>




<Route
path="/learner/assignments"
element={<Assignments />}
/>

<Route path="/learner/results" element={<LearnerResults />} />




<Route
path="/learner/lessons"
element={<Lessons />}
/>




<Route
path="/learner/announcements"
element={<Announcements />}
/>




<Route
path="/learner/payments"
element={<Payments />}
/>




<Route
path="/learner/profile"
element={<Profile />}
/>




<Route
path="/learner/browse-classes"
element={<BrowseClasses />}
/>









{/* Owner pages */}



<Route
path="/owner-home"
element={<OwnerHome />}
/>

<Route path="/owner-my-classes" element={<OwnerMyClasses />} />




<Route
path="/owner-teachers"
element={<Teachers />}
/>




<Route
path="/owner-learners"
element={<Learners />}
/>




<Route
path="/owner-payments"
element={<OwnerPayments />}
/>




<Route
path="/owner-reports"
element={<Reports />}
/>




<Route
path="/owner-settings"
element={<OwnerSettings />}
/>









{/* Main pages */}



<Route
path="/"
element={<Home />}
/>




<Route
path="/register"
element={<Register />}
/>




<Route
path="/login"
element={<Login />}
/>









{/* Learner dashboard */}



<Route
path="/learner-dashboard"
element={<LearnerDashboard />}
/>









{/* Admin */}



<Route
path="/admin-login"
element={<AdminLogin />}
/>




<Route
path="/admin"
element={<Admin />}
/>









{/* Tutor */}



<Route
path="/tutor-register"
element={<TutorRegister />}
/>




<Route
path="/tutor-login"
element={<TutorLogin />}
/>




<Route
path="/tutor-dashboard"
element={<TutorDashboard />}
/>









{/* Classroom */}



<Route
path="/classroom/:id"
element={<Classroom />}
/>




</Routes>


{!isWorkspace && <Footer />}


</div>


);
}

function App() {
    return <BrowserRouter><AppContent /></BrowserRouter>;
}

export default App;
