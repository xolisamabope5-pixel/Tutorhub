import { useEffect, useState } from "react";
import BackButton from "../../components/BackButton";

function Reports(){

    const [report,setReport] = useState(null);

    const [loading,setLoading] = useState(true);

    useEffect(()=>{

        const savedOwner = localStorage.getItem("tutor");

        if(!savedOwner){

            return;

        }

        const owner = JSON.parse(savedOwner);

        fetchReports(owner.id);

    },[]);

    const fetchReports = async(ownerId)=>{

        try{

            const response = await fetch(

                `https://tutorhub-api-bz1y.onrender.com/api/reports/owner/${ownerId}`

            );

            const data = await response.json();

            if(response.ok){

                setReport({

                    program:data.program,

                    totalTeachers:data.totalTeachers,

                    totalLearners:data.totalLearners,

                    paidLearners:data.paidPayments,

                    pendingLearners:data.pendingPayments,

                    revenue:data.revenue

                });

            }

        }catch(error){

            console.log(error);

        }finally{

            setLoading(false);

        }

    };

    if(loading){

        return <h2>Loading reports...</h2>;

    }

    return(

        <div>

            <h1>

                Reports 📊

            </h1>

            {

            report && (

                <>

                <h2>

                    {report.program.name}

                </h2>

                <p>

                    Tuition centre performance overview.

                </p>

                <hr/>

                <div>

                    <h3>

                        👥 Total Learners

                    </h3>

                    <p>

                        {report.totalLearners}

                    </p>

                </div>

                <div>

                    <h3>

                        👨‍🏫 Total Teachers

                    </h3>

                    <p>

                        {report.totalTeachers}

                    </p>

                </div>

                <div>

                    <h3>

                        ✅ Paid Payments

                    </h3>

                    <p>

                        {report.paidLearners}

                    </p>

                </div>

                <div>

                    <h3>

                        ⏳ Pending Payments

                    </h3>

                    <p>

                        {report.pendingLearners}

                    </p>

                </div>

                <div>

                    <h3>

                        💰 Revenue Collected

                    </h3>

                    <p>

                        R{report.revenue}

                    </p>

                </div>

                </>

            )

            }

            <BackButton />

        </div>

    );

}

export default Reports;
