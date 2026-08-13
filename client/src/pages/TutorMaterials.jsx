import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";


function TutorMaterials(){

    const { id } = useParams();


    const [classroom,setClassroom] = useState(null);


    const [material,setMaterial] = useState({

        title:"",
        description:"",
        file:null

    });


    const [loading,setLoading] = useState(true);



    useEffect(()=>{

        fetchClassroom();

    },[]);



    const fetchClassroom = async()=>{


        try{


            const response = await fetch(

                `http://localhost:5000/api/classes/${id}`

            );


            const data = await response.json();



            if(response.ok){

                setClassroom(data);

            }


        }catch(error){

            console.log(error);

        }finally{

            setLoading(false);

        }


    };





    const handleUpload = async()=>{


        if(!material.file){

            alert("Please choose a file");

            return;

        }



        try{


            const formData = new FormData();



            formData.append(

                "title",

                material.title

            );



            formData.append(

                "description",

                material.description

            );



            formData.append(

                "classId",

                id

            );



            formData.append(

                "uploadedBy",

                classroom.tutorId._id

            );



            formData.append(

                "file",

                material.file

            );





            const response = await fetch(

                "http://localhost:5000/api/materials/upload",

                {

                    method:"POST",

                    body:formData

                }

            );



            const data = await response.json();



            if(response.ok){


                alert(
                    "Material uploaded successfully 🚀"
                );



                setMaterial({

                    title:"",
                    description:"",
                    file:null

                });



            }else{


                alert(data.message);


            }



        }catch(error){


            console.log(error);


            alert(
                "Upload failed"
            );


        }


    };






    if(loading){

        return <h2>Loading materials...</h2>;

    }





    return(


        <div>


            <h1>
                📚 Tutor Materials
            </h1>



            {

                classroom &&

                <p>

                    Class: {classroom.className}

                </p>

            }





            <hr />



            <h2>
                Upload New Material
            </h2>




            <input

                type="text"

                placeholder="Material title"

                value={material.title}

                onChange={(e)=>

                    setMaterial({

                        ...material,

                        title:e.target.value

                    })

                }

            />



            <br/><br/>




            <textarea

                placeholder="Material description"

                value={material.description}

                onChange={(e)=>

                    setMaterial({

                        ...material,

                        description:e.target.value

                    })

                }

            />



            <br/><br/>




            <input

                type="file"

                onChange={(e)=>

                    setMaterial({

                        ...material,

                        file:e.target.files[0]

                    })

                }

            />



            <br/><br/>




            <button onClick={handleUpload}>

                Upload Material 🚀

            </button>



        </div>


    );

}



export default TutorMaterials;