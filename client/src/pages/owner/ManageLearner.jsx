import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import BackButton from "../../components/BackButton";

function ManageLearner(){

    const { id } = useParams();

    const [learner,setLearner] = useState(null);

    useEffect(()=>{

        fetchLearner();

    },[]);

    const fetchLearner = async()=>{

        try{

            const response = await fetch(

                `http://localhost:5000/api/learners/${id}`

            );

            const data = await response.json();

            setLearner(data);

        }catch(error){

            console.log(error);

        }

    };

    const approveLearner = async()=>{

        await fetch(

            `http://localhost:5000/api/learners/${id}/approve`,

            {

                method:"PUT"

            }

        );

        alert("Learner Approved ✅");

        fetchLearner();

    };

    const blockLearner = async()=>{

        await fetch(

            `http://localhost:5000/api/learners/${id}/block`,

            {

                method:"PUT"

            }

        );

        alert("Learner Blocked 🚫");

        fetchLearner();

    };

    const unblockLearner = async()=>{

        await fetch(

            `http://localhost:5000/api/learners/${id}/unblock`,

            {

                method:"PUT"

            }

        );

        alert("Learner Unblocked ✅");

        fetchLearner();

    };

    if(!learner){

        return <h2>Loading learner...</h2>;

    }

    return(

        <div>

            <h1>

                Manage Learner 📚

            </h1>

            <hr/>

            <h2>

                {learner.name} {learner.surname}

            </h2>

            <p>

                <b>Grade:</b> {learner.grade}

            </p>

            <p>

                <b>School:</b> {learner.school}

            </p>

            <p>

                <b>Subjects:</b> {learner.subjects}

            </p>

            <p>

                <b>Status:</b> {learner.status}

            </p>

            <p>

                <b>Account:</b> {learner.accountStatus}

            </p>

            {

                learner.paymentProof &&

                <button

                    onClick={()=>window.open(

                        `http://localhost:5000/uploads/${learner.paymentProof}`,

                        "_blank"

                    )}

                >

                    📄 View Payment Proof

                </button>

            }

            <br/><br/>

            {

                learner.status==="Pending" &&

                <button

                    onClick={approveLearner}

                >

                    ✅ Approve Learner

                </button>

            }

            <br/><br/>

            {

                learner.accountStatus==="Blocked"

                ?

                <button

                    onClick={unblockLearner}

                >

                    Unblock Learner

                </button>

                :

                <button

                    onClick={blockLearner}

                >

                    Block Learner

                </button>

            }

            <br/><br/>

            <BackButton/>

        </div>

    );

}

export default ManageLearner;