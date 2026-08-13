import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../../components/BackButton";


function Payments(){


    const navigate = useNavigate();


    const [payments,setPayments] = useState([]);

    const [loading,setLoading] = useState(true);





    useEffect(()=>{


        const savedOwner = localStorage.getItem("tutor");


        if(savedOwner){


            const owner = JSON.parse(savedOwner);


            fetchPayments(owner.id);


        }



    },[]);







    const fetchPayments = async(ownerId)=>{


        try{


            const response = await fetch(

                `http://localhost:5000/api/payments/owner/${ownerId}`

            );


            const data = await response.json();



            setPayments(data);



        }catch(error){


            console.log(error);


        }finally{


            setLoading(false);


        }


    };









    // remove duplicate learners

    const learners = [

        ...new Map(

            payments.map(payment =>

                [

                    payment.learnerId._id,

                    payment.learnerId

                ]

            )

        ).values()


    ];









    if(loading){


        return <h2>Loading payments...</h2>;


    }









    return(


        <div>


            <h1>

                Payments 💳

            </h1>



            <p>

                Manage learner tuition payments.

            </p>






            <h2>

                Learners

            </h2>






            {

                learners.length === 0 ?


                (

                    <p>

                        No learners found.

                    </p>


                )

                :


                learners.map((learner)=>(


                    <div

                    key={learner._id}

                    onClick={()=>navigate(

                        `/owner-payment/${learner._id}`

                    )}

                    style={{

                        border:"1px solid #ccc",

                        padding:"15px",

                        margin:"10px",

                        cursor:"pointer",

                        borderRadius:"10px"

                    }}

                    >


                        👤

                        {" "}

                        {learner.name}

                        {" "}

                        {learner.surname}


                    </div>


                ))


            }






            <BackButton />



        </div>


    );


}



export default Payments;