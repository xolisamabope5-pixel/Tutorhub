import { useState } from "react";
import { useNavigate } from "react-router-dom";


function Login() {

    const navigate = useNavigate();


    const [formData, setFormData] = useState({

        username: "",
        password: ""

    });



    const handleChange = (e) => {

        setFormData({

            ...formData,

            [e.target.name]: e.target.value

        });

    };



    const handleSubmit = async (e) => {

        e.preventDefault();


        try {


            const response = await fetch(

                "https://tutorhub-api-bz1y.onrender.com/api/learners/login",

                {

                    method: "POST",

                    headers: {

                        "Content-Type": "application/json"

                    },


                    body: JSON.stringify(formData)

                }

            );



            const data = await response.json();



            if (response.ok) {


                alert("Login successful 🚀");


                localStorage.setItem(
                    "learner",
                    JSON.stringify(data.learner)
                );


                navigate("/learner-dashboard");


            } else {


                alert(data.message);


            }



        } catch(error) {


            console.log(error);


            alert("Could not connect to server");


        }


    };



    return (

        <div>


            <h1>TutorHub</h1>


            <h2>Learner Login</h2>



            <form onSubmit={handleSubmit}>


                <input

                    type="text"

                    name="username"

                    placeholder="Username"

                    value={formData.username}

                    onChange={handleChange}

                />



                <input

                    type="password"

                    name="password"

                    placeholder="Password"

                    value={formData.password}

                    onChange={handleChange}

                />



                <button type="submit">

                    Login

                </button>



            </form>



        </div>

    );

}


export default Login;
