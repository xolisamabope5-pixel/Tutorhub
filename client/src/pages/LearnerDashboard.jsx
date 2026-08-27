import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import ClassCard from "../components/ClassCard";
import DashboardCard from "../components/DashboardCard";
import DashboardBox from "../components/DashboardBox";

function LearnerDashboard() {


    const navigate = useNavigate();


    const [learner,setLearner] = useState(null);


    const [classes,setClasses] = useState([]);









    useEffect(()=>{


        const savedLearner = localStorage.getItem("learner");



        if(!savedLearner){


            navigate("/login");


            return;


        }





        const learnerData = JSON.parse(savedLearner);



        setLearner(learnerData);





        if(
            learnerData.programId &&
            learnerData.grade
        ){


            fetchClasses(

                learnerData.programId._id,

                learnerData.grade

            );


        }



    },[navigate]);












    // Fetch only learner grade classes

    const fetchClasses = async(programId, grade)=>{


        try{


            const response = await fetch(


                `https://tutorhub-api-bz1y.onrender.com/api/classes/program/${programId}/${grade}`


            );



            const data = await response.json();



            setClasses(data);



        }catch(error){


            console.log(

                "Error fetching classes:",

                error

            );


        }


    };










    // Join class

    const joinClass = async(classId)=>{


        try{


            const response = await fetch(



                `https://tutorhub-api-bz1y.onrender.com/api/classes/${classId}/join`,



                {


                    method:"PUT",


                    headers:{


                        "Content-Type":"application/json"


                    },



                    body:JSON.stringify({


                        learnerId:learner._id


                    })



                }



            );






            const data = await response.json();






            if(response.ok){


                alert(

                    "Joined class successfully 🚀"

                );



                fetchClasses(


                    learner.programId._id,


                    learner.grade


                );



            }else{


                alert(data.message);


            }







        }catch(error){


            console.log(error);



            alert(

                "Could not join class"

            );


        }


    };












    // Check joined class

    const hasJoined=(classItem)=>{


        return classItem.learners?.some(


            (item)=>


                item._id === learner._id


        );


    };










    const logout=()=>{


        localStorage.removeItem("learner");


        navigate("/login");


    };











    if(!learner){


        return <h2>Loading...</h2>;


    }









    return(


        <div>


            <h1>

                Welcome {learner.name} 👋

            </h1>





            <h2>

                TutorHub Learner Dashboard

            </h2>

            <div

style={{

display:"flex",

gap:"20px",

flexWrap:"wrap",

marginTop:"30px"

}}

>


<DashboardBox

icon="📚"

title="My Classes"

description="Access your classrooms"

onClick={()=>navigate("/learner/classes")}

/>
<DashboardBox

icon="🔎"

title="Browse Classes"

description="Find classes to join"

onClick={()=>navigate("/learner/browse-classes")}

/>


<DashboardBox

icon="📝"

title="Assignments"

description="View your assignments"

onClick={()=>navigate("/learner/assignments")}

/>



<DashboardBox

icon="🎥"

title="Lessons"

description="Watch lessons and recordings"

onClick={()=>navigate("/learner/lessons")}

/>



<DashboardBox

icon="📢"

title="Announcements"

description="Tuition updates"

onClick={()=>navigate("/learner/announcements")}

/>



<DashboardBox

icon="💳"

title="Payments"

description="Manage tuition payments"

onClick={()=>navigate("/learner/payments")}

/>



<DashboardBox

icon="👤"

title="Profile"

description="View your profile"

onClick={()=>navigate("/learner/profile")}

/>



</div>








            <hr/>








           



            <div

            style={{


                display:"flex",


                gap:"20px",


                flexWrap:"wrap",


                marginBottom:"30"


            }}

            >






                <DashboardCard

                icon="📚"

                title="My Classes"

                value={

                    classes.filter(

                        item=>hasJoined(item)

                    ).length

                }

                />






                <DashboardCard

                icon="📝"

                title="Assignments"

                value="0"

                />






                <DashboardCard

                icon="🎥"

                title="Lessons"

                value="0"

                />






                <DashboardCard

                icon="📢"

                title="Announcements"

                value="0"

                />






            </div>









            <hr/>

















            <br/>






            <button onClick={logout}>


                Logout


            </button>







        </div>


    );


}



export default LearnerDashboard;
