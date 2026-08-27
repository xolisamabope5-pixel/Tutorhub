import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


function CreateClass(){


    const navigate = useNavigate();


    const [tutor,setTutor] = useState(null);



    const [form,setForm] = useState({

        className:"",
        grade:"",
        subject:"",
        description:""

    });







    useEffect(()=>{


        const savedTutor = localStorage.getItem("tutor");



        if(!savedTutor){


            navigate("/tutor-login");

            return;


        }





        const tutorData = JSON.parse(savedTutor);



        setTutor(tutorData);



    },[]);









    const handleChange=(e)=>{


        setForm({


            ...form,


            [e.target.name]:e.target.value


        });


    };









    const createClass = async(e)=>{


        e.preventDefault();





        if(


            !form.grade ||

            !form.className ||

            !form.subject


        ){


            alert(

                "Please complete all required fields"

            );


            return;


        }









        try{


            const response = await fetch(


                "https://tutorhub-api-bz1y.onrender.com/api/classes/create",


                {


                    method:"POST",



                    headers:{


                        "Content-Type":"application/json"


                    },



                    body:JSON.stringify({

                        tutorId:tutor.id,

                        programId:tutor.programId,

                        className:form.className,

                        grade:form.grade,

                        subject:form.subject,

                        description:form.description

                    })


                }


            );









            const data = await response.json();











            if(response.ok){



                alert(

                    "Class created successfully 🚀"

                );





                navigate(

                    `/classroom/${data.class._id}`

                );





            }else{


                alert(data.message);


            }









        }catch(error){


            console.log(error);



            alert(

                "Could not create class"

            );


        }


    };









    return(


        <div>



            <h1>

                Create New Class 📚

            </h1>




            <p>

                Create a classroom for your learners.

            </p>











            <form onSubmit={createClass}>









                <input


                type="text"


                name="className"


                placeholder="Class name e.g Grade 12 Mathematics"


                value={form.className}


                onChange={handleChange}


                />









                <br/><br/>









                <select


                name="grade"


                value={form.grade}


                onChange={handleChange}


                >



                    <option value="">


                        Select Grade


                    </option>




                    <option value="9">


                        Grade 9


                    </option>




                    <option value="10">


                        Grade 10


                    </option>




                    <option value="11">


                        Grade 11


                    </option>




                    <option value="12">


                        Grade 12


                    </option>



                </select>









                <br/><br/>









                <input


                type="text"


                name="subject"


                placeholder="Subject e.g Mathematics"


                value={form.subject}


                onChange={handleChange}


                />









                <br/><br/>









                <textarea


                name="description"


                placeholder="Class description"


                value={form.description}


                onChange={handleChange}


                />









                <br/><br/>









                <button type="submit">



                    Create Classroom 🚀



                </button>











            </form>









        </div>


    );


}


export default CreateClass;
