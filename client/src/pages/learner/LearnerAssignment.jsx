import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import BackButton from "../../components/BackButton";


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

`https://tutorhub-api-bz1y.onrender.com/api/assignments/${id}`

);



const data = await response.json();


setAssignment(data);



const emptyAnswers = data.questions.map(()=>({

questionId:"",

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

`https://tutorhub-api-bz1y.onrender.com/api/submissions/learner/${learner._id}/${id}`

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

"https://tutorhub-api-bz1y.onrender.com/api/submissions/upload",

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
