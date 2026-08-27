import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import BackButton from "../../components/BackButton";


function LearnerPayments(){


    const {id} = useParams();


    const [payments,setPayments] = useState([]);



    useEffect(()=>{


        fetchPayments();


    },[]);






    const fetchPayments = async()=>{


        try{


            const response = await fetch(

                `https://tutorhub-api-bz1y.onrender.com/api/payments/learner/${id}`

            );


            const data = await response.json();


            setPayments(data);



        }catch(error){


            console.log(error);


        }


    };







    const approvePayment = async(paymentId)=>{


        try{


            await fetch(

                `https://tutorhub-api-bz1y.onrender.com/api/payments/${paymentId}/approve`,

                {

                    method:"PUT"

                }

            );


            alert(

                "Payment approved ✅"

            );


            fetchPayments();



        }catch(error){


            console.log(error);


        }


    };







    const rejectPayment = async(paymentId)=>{


        try{


            await fetch(

                `https://tutorhub-api-bz1y.onrender.com/api/payments/${paymentId}/reject`,

                {

                    method:"PUT"

                }

            );


            alert(

                "Payment rejected"

            );


            fetchPayments();



        }catch(error){


            console.log(error);


        }


    };







    return(


        <div>


            <h1>

                Learner Payments 💳

            </h1>





            {

                payments.length === 0 ?


                <p>

                    No payment records found.

                </p>


                :



                payments.map((payment)=>(


                    <div

                    key={payment._id}

                    style={{


                        border:"1px solid #ccc",

                        padding:"15px",

                        marginTop:"15px",

                        borderRadius:"10px"


                    }}

                    >



                    <h2>


                    {payment.month} {payment.year}


                    </h2>




                    <p>


                    Amount: R{payment.amount}


                    </p>





                    <p>


                    Status: {payment.status}


                    </p>







                    {

                    payment.proof &&


                    <a

                    href={`https://tutorhub-api-bz1y.onrender.com/uploads/${payment.proof}`}

                    target="_blank"

                    rel="noreferrer"

                    >


                    <button>

                    View Proof 📄

                    </button>


                    </a>


                    }





                    <br/><br/>







                    {

                    payment.status === "Pending" &&

                    <>


                    <button

                    onClick={()=>approvePayment(payment._id)}

                    >

                    Approve ✅

                    </button>




                    {" "}





                    <button

                    onClick={()=>rejectPayment(payment._id)}

                    >

                    Reject ❌

                    </button>


                    </>


                    }



                    </div>


                ))


            }





            <BackButton />


        </div>


    );


}


export default LearnerPayments;
