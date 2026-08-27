import { useState } from "react";
import { useNavigate } from "react-router-dom";


function TutorLogin() {


  const navigate = useNavigate();


  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");



  const handleLogin = async (e) => {

    e.preventDefault();


    try {


      const response = await fetch(
        "https://tutorhub-api-bz1y.onrender.com/api/tutors/login",
        {

          method: "POST",

          headers: {

            "Content-Type": "application/json"

          },


          body: JSON.stringify({

            username,

            password

          })

        }

      );



      const data = await response.json();



      if(response.ok){


        localStorage.setItem(
          "tutor",
          JSON.stringify(data.tutor)
        );


        alert("Login successful 🚀");


        if(data.tutor.role === "owner"){


    navigate("/owner-dashboard");


}else{


    navigate("/tutor-dashboard");


}


      } else {


        alert(data.message);


      }



    } catch(error){


      console.log(error);


      alert("Could not connect to server");


    }


  };




  return (

    <div>


      <h1>TutorHub</h1>


      <h2>Tutor Login</h2>



      <form onSubmit={handleLogin}>


        <input

          type="text"

          placeholder="Username"

          value={username}

          onChange={(e)=>setUsername(e.target.value)}

        />



        <input

          type="password"

          placeholder="Password"

          value={password}

          onChange={(e)=>setPassword(e.target.value)}

        />



        <button type="submit">

          Login

        </button>



      </form>



    </div>

  );

}


export default TutorLogin;
