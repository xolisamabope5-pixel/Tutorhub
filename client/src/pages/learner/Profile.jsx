import { useNavigate } from "react-router-dom";
import BackButton from "../../components/BackButton";


function Profile(){


    const learner = JSON.parse(
        localStorage.getItem("learner")
    );


    if(!learner){

        return <h2>No learner data found</h2>;

    }



    return(


        <div>


            <h1>
                Learner Profile 👤
            </h1>


            <hr/>


            <p>
                Name: {learner.name} {learner.surname}
            </p>


            <p>
                Grade: {learner.grade}
            </p>


            <p>
                School: {learner.school}
            </p>


            <p>
                Subjects: {learner.subjects}
            </p>


            <p>
                Username: {learner.username}
            </p>


            <hr/>


            <h3>
                Tuition Centre 🏫
            </h3>


            <p>
                Centre: {learner.programId?.name}
            </p>


            <p>
                Location: {learner.programId?.location}
            </p>


            <hr/>


            <h3>
                Tutor 👨‍🏫
            </h3>


            <p>
                {learner.tutorId?.name} {learner.tutorId?.surname}
            </p>


            <p>
                Subjects: {learner.tutorId?.subjects}
            </p>



            <br/>


            <BackButton />


        </div>


    );


}


export default Profile;