import {useEffect,useState} from "react";
import {useParams,useNavigate} from "react-router-dom";


function TutorSubmissions(){


const {id}=useParams();

const navigate = useNavigate();


const [submissions,setSubmissions]=useState([]);



useEffect(()=>{

loadSubmissions();

},[]);



const loadSubmissions=async()=>{


try{


const response = await fetch(

`https://tutorhub-api-bz1y.onrender.com/api/submissions/assignment/${id}`

);


const data = await response.json();


console.log(data);


setSubmissions(data);



}catch(error){

console.log(error);

}


};




return(

<div>


<h1>
👥 Learner Submissions
</h1>



{

submissions.map((submission)=>(


<div

key={submission._id}

style={{

border:"1px solid #ccc",

padding:"15px",

margin:"10px",

cursor:"pointer"

}}


onClick={()=>navigate(`/mark-submission/${submission._id}`)}

>


<h3>

{submission.learnerId?.name}

{" "}

{submission.learnerId?.surname}

</h3>


<p>

Status:

{submission.status}

</p>


<p>

Mark:

{submission.mark ?? "Not marked"}

</p>


</div>


))


}



</div>


);


}


export default TutorSubmissions;
