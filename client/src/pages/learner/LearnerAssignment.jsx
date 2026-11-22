import API_URL from "../../api.js";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import BackButton from "../../components/BackButton";
import "../../styles/learner-assignments.css";

const assignmentFileUrl = (value) => {
    if (!value) return "";
    const url = String(value).trim();
    if (/^https?:\/\//i.test(url) || url.startsWith("blob:") || url.startsWith("data:")) return url;
    return `${API_URL.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
};

function LearnerAssignment(){


const { id } = useParams();


const [assignment,setAssignment] = useState(null);

const [answers,setAnswers] = useState([]);

const [submission,setSubmission] = useState(null);



useEffect(()=>{

fetchAssignment();

checkSubmission();

},[]);






const fetchAssignment = async()=>{


try{


const response = await fetch(

`${API_URL}/api/assignments/${id}`

);



const data = await response.json();


setAssignment(data);



const emptyAnswers = (data.questions || []).map((question)=>({

questionId: question._id,

answer:""

}));


setAnswers(emptyAnswers);



}catch(error){

console.log(error);

}


};








const checkSubmission = async()=>{


try{


const learner = JSON.parse(

localStorage.getItem("learner")

);



if(!learner){

return;

}



const response = await fetch(

`${API_URL}/api/submissions/learner/${learner._id}/${id}`

);



if(response.ok){


const data = await response.json();


setSubmission(data);


}



}catch(error){

console.log(error);

}


};








const updateAnswer=(index,value)=>{


const updated=[...answers];


updated[index].answer=value;


setAnswers(updated);


};








const submitAssignment=async()=>{


try{


const learner = JSON.parse(

localStorage.getItem("learner")

);




const response = await fetch(

`${API_URL}/api/submissions/create`,

{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

learnerId:learner._id,

assignmentId:id,

answers:answers

})


}

);



const data = await response.json();



if(response.ok){


alert("Assignment submitted 🚀");


checkSubmission();


}else{


alert(data.message);


}




}catch(error){

console.log(error);

}



};







if(!assignment){

return <h2>Loading assignment...</h2>

}







return(


<div>



<h1>

📝 {assignment.title}

</h1>



<p>

{assignment.description}

</p>

{assignment.attachment && <section className="th-assignment-resource"><div><span className="th-assignment-file-icon">↓</span><div><strong>Assignment attachment</strong><small>Download the supporting file.</small></div></div><a href={assignmentFileUrl(assignment.attachment)} target="_blank" rel="noreferrer" download>Download file</a></section>}


<p>

Total Marks:

{assignment.totalMarks}

</p>




<hr/>





{

submission && (


<div

style={{

border:"2px solid green",

padding:"20px",

marginBottom:"20px"

}}

>


<h2>

📌 Submission Result

</h2>



<p>

Status:

{submission.status}

</p>



<p>

Your Mark:

{submission.mark || submission.totalMark || 0}

/

{assignment.totalMarks}

</p>




<h3>

Tutor Feedback:

</h3>


<p>

{submission.feedback || "No feedback yet"}

</p>



</div>


)

}







{

!submission && assignment.questions.map((question,index)=>(


<div key={question._id}>


<h3>

Question {index+1}

</h3>



<p>

{question.questionText}

</p>



<p>

Marks:

{question.marks}

</p>




<textarea

placeholder="Write your answer here..."

value={

answers[index]?.answer || ""

}


onChange={(e)=>

updateAnswer(

index,

e.target.value

)

}


/>



<hr/>


</div>


))

}








{

!submission &&

<button onClick={submitAssignment}>

Submit Assignment 🚀

</button>

}





<br/><br/>




<BackButton />


</div>


);


}


export default LearnerAssignment;
