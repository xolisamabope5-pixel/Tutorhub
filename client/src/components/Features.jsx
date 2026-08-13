import "./Features.css";


function Features() {

  const features = [

    {
      title: "Learner Management",
      description:
      "Keep learner information organised in one secure place."
    },


    {
      title: "Payment Tracking",
      description:
      "Track registrations and payment confirmations easily."
    },


    {
      title: "Class Organisation",
      description:
      "Manage subjects, tutors and learning schedules."
    },


    {
      title: "Learning Resources",
      description:
      "Share notes, lessons and learning materials with learners."
    }

  ];


  return (

    <section className="features">


      <h2>
        Why TutorHub?
      </h2>


      <div className="feature-grid">


        {features.map((feature, index) => (

          <div className="feature-card" key={index}>

            <h3>
              {feature.title}
            </h3>


            <p>
              {feature.description}
            </p>


          </div>

        ))}


      </div>


    </section>

  );

}


export default Features;