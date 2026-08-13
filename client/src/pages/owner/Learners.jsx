import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import BackButton from "../../components/BackButton";

function Learners(){

    const navigate = useNavigate();

    const [learners,setLearners] = useState([]);

    const [loading,setLoading] = useState(true);

    useEffect(()=>{

        const savedOwner = localStorage.getItem("tutor");

        if(!savedOwner){

            return;

        }

        const owner = JSON.parse(savedOwner);

        fetchLearners(owner.id);

    },[]);

    const fetchLearners = async(ownerId)=>{

        try{

            const response = await fetch(

                `http://localhost:5000/api/programs/owner/${ownerId}`

            );

            const data = await response.json();

            if(response.ok){

                setLearners(data.learners);

            }

        }catch(error){

            console.log(error);

        }finally{

            setLoading(false);

        }

    };

    if(loading){

        return <h2>Loading learners...</h2>;

    }

    return(

        <div>

            <h1>

                Learners 📚

            </h1>

            <p>

                Manage your tuition centre learners.

            </p>

            {

                learners.length===0 ?

                (

                    <p>

                        No learners found.

                    </p>

                )

                :

                (

                    learners.map((learner)=>(

                        <div

                        key={learner._id}

                        style={{

                            border:"1px solid #ccc",

                            borderRadius:"10px",

                            padding:"15px",

                            marginBottom:"15px"

                        }}

                        >

                            <h3>

                                {learner.name} {learner.surname}

                            </h3>

                            <button

                            onClick={()=>navigate(`/manage-learner/${learner._id}`)}

                            >

                                Manage Learner 📚

                            </button>

                        </div>

                    ))

                )

            }

            <BackButton/>

        </div>

    );

}

export default Learners;