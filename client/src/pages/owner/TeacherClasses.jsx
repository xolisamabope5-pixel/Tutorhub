import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import BackButton from "../../components/BackButton";

function TeacherClasses(){

    const { id } = useParams();

    const [classes,setClasses] = useState([]);

    const [loading,setLoading] = useState(true);

    useEffect(()=>{

        fetchClasses();

    },[]);

    const fetchClasses = async()=>{

        try{

            const response = await fetch(
                `https://tutorhub-api-bz1y.onrender.com/api/classes/tutor/${id}`
            );

            const data = await response.json();

            if(response.ok){

                setClasses(data);

            }

        }catch(error){

            console.log(error);

        }finally{

            setLoading(false);

        }

    };

    if(loading){

        return <h2>Loading classes...</h2>;

    }

    return(

        <div>

            <h1>
                Teacher Classes 📚
            </h1>

            <p>
                Classes created by this teacher.
            </p>

            <hr/>

            {

                classes.length===0 ?

                (

                    <p>
                        This teacher has not created any classes yet.
                    </p>

                )

                :

                (

                    classes.map((item)=>(

                        <div

                        key={item._id}

                        style={{

                            border:"1px solid #ddd",

                            borderRadius:"10px",

                            padding:"15px",

                            marginBottom:"15px"

                        }}

                        >

                            <h3>

                                {item.className}

                            </h3>

                            <p>

                                <b>Subject:</b> {item.subject}

                            </p>

                            <p>

                                <b>Description:</b> {item.description}

                            </p>

                            <p>

                                <b>Learners Enrolled:</b> {item.learners.length}

                            </p>

                        </div>

                    ))

                )

            }

            <BackButton/>

        </div>

    );

}

export default TeacherClasses;
