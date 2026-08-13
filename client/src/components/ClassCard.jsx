import "./ClassCard.css";


function ClassCard({ classroom, onClick, buttonText }) {


    return (

        <div className="class-card">


            <h2>
                📚 {classroom.className}
            </h2>


            <p>
                <strong>Subject:</strong> {classroom.subject}
            </p>


            <p>
                {classroom.description}
            </p>



            {classroom.tutorId && (

                <p>
                    👨‍🏫 Tutor: {classroom.tutorId.name} {classroom.tutorId.surname}
                </p>

            )}




            <p>
                👥 Learners enrolled: {classroom.learners?.length || 0}
            </p>




            <button onClick={onClick}>

                {buttonText}

            </button>



        </div>

    );

}


export default ClassCard;