import { useEffect, useState } from "react";


function Register() {


  const [programs, setPrograms] = useState([]);

  const [tutors, setTutors] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);


  const [formData, setFormData] = useState({

    name: "",
    surname: "",
    grade: "",
    school: "",
    subjects: "",
    programId: "",
    tutorId: "",
    username: "",
    password: "",
    confirmPassword: ""

  });



  const [paymentProof, setPaymentProof] = useState(null);






  // Load tuition centres

  useEffect(() => {


    fetchPrograms();


  }, []);








  const fetchPrograms = async () => {


    try {


      const response = await fetch(

        "https://tutorhub-api-bz1y.onrender.com/api/programs"

      );


      const data = await response.json();


      setPrograms(data);



    } catch(error) {


      console.log(error);


    }


  };









  // Load tutors when tuition selected

  const handleProgramChange = async(e)=>{


    const programId = e.target.value;



    setFormData({

      ...formData,

      programId,

      tutorId:""

    });




    if(!programId) return;





    try{


      const response = await fetch(


        `https://tutorhub-api-bz1y.onrender.com/api/programs/${programId}/tutors`


      );



      const data = await response.json();



      setTutors(data);
      const programResponse = await fetch(

        `https://tutorhub-api-bz1y.onrender.com/api/programs/${programId}`

      );

      const programData = await programResponse.json();

      setSelectedProgram(programData);


    }catch(error){


      console.log(error);


    }



  };









  const handleChange = (e) => {


    setFormData({

      ...formData,

      [e.target.name]: e.target.value

    });


  };









  const handleSubmit = async (e) => {


    e.preventDefault();




    if (

      !formData.name ||

      !formData.surname ||

      !formData.grade ||

      !formData.school ||

      !formData.subjects ||

      !formData.programId ||

      !formData.tutorId ||

      !formData.username ||

      !formData.password ||

      !formData.confirmPassword ||

      !paymentProof

    ) {


      alert(

        "Please complete all fields and select tuition/tutor."

      );


      return;


    }








    if(formData.password !== formData.confirmPassword){


      alert("Passwords do not match!");

      return;


    }







    try{



      const form = new FormData();



      form.append("name", formData.name);

      form.append("surname", formData.surname);

      form.append("grade", formData.grade);

      form.append("school", formData.school);

      form.append("subjects", formData.subjects);



      // NEW CONNECTIONS

      form.append("programId", formData.programId);

      form.append("tutorId", formData.tutorId);



      form.append("username", formData.username);

      form.append("password", formData.password);



      form.append(

        "paymentProof",

        paymentProof

      );








      const response = await fetch(

        "https://tutorhub-api-bz1y.onrender.com/api/learners/register",

        {

          method:"POST",

          body:form

        }

      );






      const data = await response.json();





      if(!response.ok){


        alert(

          data.message || "Registration failed"

        );


        return;


      }






      alert(

        "Registration submitted. Waiting for approval 🚀"

      );







      setFormData({

        name:"",
        surname:"",
        grade:"",
        school:"",
        subjects:"",
        programId:"",
        tutorId:"",
        username:"",
        password:"",
        confirmPassword:""

      });



      setPaymentProof(null);



      setTutors([]);





    }catch(error){


      console.log(error);


      alert(

        "Could not connect to server"

      );


    }



  };









  return (

    <div>


      <h1>TutorHub</h1>


      <h2>Learner Registration</h2>


      <p>

        Register and join your chosen tuition centre.

      </p>




      <form onSubmit={handleSubmit}>





        <input

          type="text"

          name="name"

          placeholder="Name"

          value={formData.name}

          onChange={handleChange}

        />





        <input

          type="text"

          name="surname"

          placeholder="Surname"

          value={formData.surname}

          onChange={handleChange}

        />





        <input

          type="text"

          name="grade"

          placeholder="Grade"

          value={formData.grade}

          onChange={handleChange}

        />





        <input

          type="text"

          name="school"

          placeholder="School"

          value={formData.school}

          onChange={handleChange}

        />





        <input

          type="text"

          name="subjects"

          placeholder="Subjects"

          value={formData.subjects}

          onChange={handleChange}

        />


        {

selectedProgram && (

<div

style={{

border:"1px solid #ccc",

padding:"15px",

marginTop:"15px",

marginBottom:"15px",

borderRadius:"10px",

background:"#f8f8f8"

}}

>

<h3>🏦 Tuition Centre Banking Details</h3>

<p>

<strong>Tuition Centre:</strong>

{" "}

{selectedProgram.name}

</p>

<p>

<strong>Bank:</strong>

{" "}

{selectedProgram.bankName}

</p>

<p>

<strong>Account Holder:</strong>

{" "}

{selectedProgram.accountHolder}

</p>

<p>

<strong>Account Number:</strong>

{" "}

{selectedProgram.accountNumber}

</p>

<p>

<strong>Branch Code:</strong>

{" "}

{selectedProgram.branchCode}

</p>

<p>

<strong>Monthly Fee:</strong>

{" "}

R{selectedProgram.monthlyFee}

</p>

<p style={{color:"green"}}>

✅ Please make payment using the details above, then upload your proof of payment below.

</p>

</div>

)

}




        <h3>Select Tuition Centre</h3>



        <select

          value={formData.programId}

          onChange={handleProgramChange}

        >


          <option value="">Choose Tuition</option>


          {

            programs.map(program=>(


              <option

                key={program._id}

                value={program._id}

              >

                {program.name}


              </option>


            ))

          }


        </select>








        <h3>Select Tutor</h3>



        <select

          name="tutorId"

          value={formData.tutorId}

          onChange={handleChange}

        >


          <option value="">Choose Tutor</option>


          {


            tutors.map(tutor=>(


              <option

                key={tutor._id}

                value={tutor._id}

              >

                {tutor.name} {tutor.surname}

              </option>


            ))

          }



        </select>








        <label>

          Upload Proof of Payment


          <input

            type="file"

            onChange={(e)=>

              setPaymentProof(e.target.files[0])

            }

          />


        </label>








        <input

          type="text"

          name="username"

          placeholder="Create Username"

          value={formData.username}

          onChange={handleChange}

        />






        <input

          type="password"

          name="password"

          placeholder="Create Password"

          value={formData.password}

          onChange={handleChange}

        />






        <input

          type="password"

          name="confirmPassword"

          placeholder="Confirm Password"

          value={formData.confirmPassword}

          onChange={handleChange}

        />






        <button type="submit">

          Create Account

        </button>





      </form>



    </div>

  );

}


export default Register;
