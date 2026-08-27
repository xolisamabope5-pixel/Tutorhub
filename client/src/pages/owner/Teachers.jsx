import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import BackButton from "../../components/BackButton";


function Teachers(){


    const navigate = useNavigate();



    const [teachers,setTeachers] = useState([]);

    const [loading,setLoading] = useState(true);







    useEffect(()=>{


        const savedOwner = localStorage.getItem("tutor");



        if(!savedOwner){

            return;

        }





        const owner = JSON.parse(savedOwner);



        fetchTeachers(owner.id);



    },[]);









    const fetchTeachers = async(ownerId)=>{


        try{


            const response = await fetch(


                `https://tutorhub-api-bz1y.onrender.com/api/programs/owner/${ownerId}`


            );



            const data = await response.json();





            if(response.ok){


                setTeachers(data.tutors);


            }





        }catch(error){


            console.log(error);


        }finally{


            setLoading(false);


        }


    };









    if(loading){


        return <h2>Loading teachers...</h2>;


    }









    return(


        <div>


            <h1>

                Teachers 👨‍🏫

            </h1>





            <p>

                Manage your tuition centre teachers.

            </p>








            {


            teachers.length === 0 ?



            (


                <p>

                    No teachers found.

                </p>


            )



            :



            (


                teachers.map((teacher)=>(



                    <div


                    key={teacher._id}



                    style={{


                        border:"1px solid #ccc",


                        padding:"15px",


                        margin:"15px",


                        borderRadius:"10px"


                    }}



                    >





                        <h3>


                            {teacher.name} {teacher.surname}


                        </h3>






                        <p>

                            Subjects:

                            {" "}

                            {teacher.subjects}

                        </p>







                        <p>

                            Role:

                            {" "}

                            {teacher.role}

                        </p>








                        <p>

                            Status:

                            {" "}

                            {teacher.status}

                        </p>








                        <button


                        onClick={()=>navigate(`/manage-teacher/${teacher._id}`)}


                        >


                            Manage Teacher 👨‍🏫


                        </button>






                    </div>



                ))


            )



            }









            <br/>





            <BackButton />




        </div>


    );


}



export default Teachers;
