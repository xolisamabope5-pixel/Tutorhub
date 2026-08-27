import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import LearnerDashboard from "./pages/LearnerDashboard";
import TeacherClasses from "./pages/owner/TeacherClasses";
import TutorRegister from "./pages/TutorRegister";
import TutorLogin from "./pages/TutorLogin";
import TutorDashboard from "./pages/TutorDashboard";
import LearnerAssignment from "./pages/learner/LearnerAssignment";
import Classroom from "./pages/Classroom";
import TutorMarkSubmission from "./pages/TutorMarkSubmission";
import CreateClass from "./pages/CreateClass";
import ManageTeacher from "./pages/ManageTeacher";



// Learner pages

import MyClasses from "./pages/learner/MyClasses";
import Assignments from "./pages/learner/Assignments";
import Lessons from "./pages/learner/Lessons";
import Announcements from "./pages/learner/Announcements";
import Payments from "./pages/learner/Payments";
import Profile from "./pages/learner/Profile";
import BrowseClasses from "./pages/learner/BrowseClasses";



// Owner pages

import ManageLearner from "./pages/owner/ManageLearner";
import LearnerPayments from "./pages/owner/LearnerPayments";
import OwnerHome from "./pages/owner/OwnerHome";
import Teachers from "./pages/owner/Teachers";
import Learners from "./pages/owner/Learners";
import OwnerPayments from "./pages/owner/Payments";
import Reports from "./pages/owner/Reports";
import OwnerSettings from "./pages/owner/OwnerSettings";





function App() {


return (

<BrowserRouter>


<Navbar />


<Routes>



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
    path="/owner/tutorhub-payment"
    element={<OwnerTutorHubPayment />}
/>


<Route 
path="/tutor-submissions/:id" 
element={<TutorSubmissions/>}
/>







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


<Footer />


</BrowserRouter>


);


}


export default App;
