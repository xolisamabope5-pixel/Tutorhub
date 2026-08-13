import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import BackButton from "../components/BackButton";

function ManageTeacher(){

    const { id } = useParams();

    const navigate = useNavigate();

    const [teacher,setTeacher] = useState(null);

    useEffect(()=>{

        fetchTeacher();

    },[]);


    const fetchTeacher = async()=>{

        try{

            const response = await fetch(
                `http://localhost:5000/api/tutors/${id}`
            );

            const data = await response.json();

            setTeacher(data);

        }catch(error){

            console.log(error);

        }

    };



    const blockTeacher = async()=>{

        try{

            await fetch(

                `http://localhost:5000/api/tutors/${id}/reject`,

                {
                    method:"PUT"
                }

            );

            alert("Teacher blocked");

            fetchTeacher();

        }catch(error){

            console.log(error);

        }

    };





    const unblockTeacher = async()=>{

        try{

            await fetch(

                `http://localhost:5000/api/tutors/${id}/approve`,

                {
                    method:"PUT"
                }

            );


            alert("Teacher approved/unblocked");

            fetchTeacher();


        }catch(error){

            console.log(error);

        }

    };





    if(!teacher){

        return <h2>Loading teacher...</h2>;

    }




    return(

        <div>


            <h1>
                Manage Teacher 👨‍🏫
            </h1>



            <hr/>




            <h2>
                Teacher Profile
            </h2>




            <p>

                <b>Name:</b>{" "}

                {teacher.name} {teacher.surname}

            </p>




            <p>

                <b>Subjects:</b>{" "}

                {teacher.subjects}

            </p>




            <p>

                <b>Status:</b>{" "}

                {teacher.status}

            </p>







            {


            teacher.status==="Pending"

            ?

            (

                <button onClick={unblockTeacher}>

                    Approve Teacher ✅

                </button>


            )


            :


            teacher.status==="Blocked"


            ?


            (

                <button onClick={unblockTeacher}>

                    Unblock Teacher 🔓

                </button>


            )


            :


            (

                <button onClick={blockTeacher}>

                    Block Teacher 🚫

                </button>


            )


            }







            <hr/>





            <h2>
                Teacher Management
            </h2>




            <button

                onClick={()=>navigate(`/teacher-classes/${teacher._id}`)}

            >

                📚 View Classes

            </button>





            <br/><br/>





            <button disabled>

                📊 Performance (Coming Soon)

            </button>





            <br/><br/>





            <button disabled>

                ⚙️ Teacher Settings (Coming Soon)

            </button>





            <br/><br/>




            <BackButton/>




        </div>

    );

}


export default ManageTeacher;