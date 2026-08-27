import { useEffect, useState } from "react";
import BackButton from "../../components/BackButton";

function OwnerSettings(){

    const [program,setProgram] = useState(null);

    const [formData,setFormData] = useState({

        name:"",
        location:"",
        description:"",
        bankName:"",
        accountHolder:"",
        accountNumber:"",
        branchCode:"",
        monthlyFee:0

    });


    const [passwordData,setPasswordData] = useState({

        currentPassword:"",
        newPassword:"",
        confirmPassword:""

    });


    const [loading,setLoading] = useState(true);



    useEffect(()=>{


        const savedOwner = localStorage.getItem("tutor");


        if(!savedOwner){

            return;

        }


        const owner = JSON.parse(savedOwner);


        fetchSettings(owner.id);



    },[]);







    const fetchSettings = async(ownerId)=>{


        try{


            const response = await fetch(


                `https://tutorhub-api-bz1y.onrender.com/api/programs/owner/${ownerId}/settings`


            );



            const data = await response.json();




            if(response.ok){


                setProgram(data);



                setFormData({


                    name:data.name || "",

                    location:data.location || "",

                    description:data.description || "",

                    bankName:data.bankName || "",

                    accountHolder:data.accountHolder || "",

                    accountNumber:data.accountNumber || "",

                    branchCode:data.branchCode || "",

                    monthlyFee:data.monthlyFee || 0


                });



            }



        }catch(error){


            console.log(error);


        }finally{


            setLoading(false);


        }


    };








    const handleChange=(e)=>{


        setFormData({


            ...formData,


            [e.target.name]:e.target.value


        });


    };









    const handleSave = async()=>{


        try{


            const savedOwner = JSON.parse(

                localStorage.getItem("tutor")

            );



            const response = await fetch(


                `https://tutorhub-api-bz1y.onrender.com/api/programs/owner/${savedOwner.id}/settings`,


                {


                    method:"PUT",


                    headers:{


                        "Content-Type":"application/json"


                    },


                    body:JSON.stringify(formData)


                }


            );



            const data = await response.json();




            if(response.ok){


                alert(data.message);


                fetchSettings(savedOwner.id);



            }else{


                alert(data.message);


            }



        }catch(error){


            console.log(error);


            alert("Could not save settings");


        }


    };









    const handlePasswordChange = async()=>{


        if(

            passwordData.newPassword !== passwordData.confirmPassword

        ){


            alert("New passwords do not match");


            return;


        }





        try{


            const savedOwner = JSON.parse(

                localStorage.getItem("tutor")

            );



            const response = await fetch(


                `https://tutorhub-api-bz1y.onrender.com/api/tutors/${savedOwner.id}/change-password`,


                {


                    method:"PUT",


                    headers:{


                        "Content-Type":"application/json"


                    },


                    body:JSON.stringify({


                        currentPassword:passwordData.currentPassword,


                        newPassword:passwordData.newPassword


                    })


                }


            );



            const data = await response.json();




            if(response.ok){


                alert(data.message);



                setPasswordData({


                    currentPassword:"",

                    newPassword:"",

                    confirmPassword:""


                });



            }else{


                alert(data.message);


            }




        }catch(error){


            console.log(error);


            alert("Could not change password");


        }


    };









    if(loading){


        return <h2>Loading settings...</h2>;


    }









    return(


        <div>


            <h1>

                Settings ⚙️

            </h1>





            {


            program ?


            (


                <div>



                    <h2>Edit Tuition Centre</h2>





                    <input

                        type="text"

                        name="name"

                        placeholder="Tuition Centre Name"

                        value={formData.name}

                        onChange={handleChange}

                    />



                    <br/><br/>





                    <input

                        type="text"

                        name="location"

                        placeholder="Location"

                        value={formData.location}

                        onChange={handleChange}

                    />



                    <br/><br/>





                    <textarea

                        name="description"

                        placeholder="Description"

                        value={formData.description}

                        onChange={handleChange}

                    />



                    <br/><br/>





                    <h3>Bank Details</h3>





                    <input

                        type="text"

                        name="bankName"

                        placeholder="Bank Name"

                        value={formData.bankName}

                        onChange={handleChange}

                    />



                    <br/><br/>





                    <input

                        type="text"

                        name="accountHolder"

                        placeholder="Account Holder"

                        value={formData.accountHolder}

                        onChange={handleChange}

                    />



                    <br/><br/>





                    <input

                        type="text"

                        name="accountNumber"

                        placeholder="Account Number"

                        value={formData.accountNumber}

                        onChange={handleChange}

                    />



                    <br/><br/>





                    <input

                        type="text"

                        name="branchCode"

                        placeholder="Branch Code"

                        value={formData.branchCode}

                        onChange={handleChange}

                    />



                    <br/><br/>





                    <h3>Monthly Fee</h3>





                    <input

                        type="number"

                        name="monthlyFee"

                        value={formData.monthlyFee}

                        onChange={handleChange}

                    />



                    <br/><br/>





                    <button onClick={handleSave}>


                        Save Changes 💾


                    </button>







                    <hr/>







                    <h2>

                        Change Password 🔒

                    </h2>





                    <input

                        type="password"

                        placeholder="Current Password"

                        value={passwordData.currentPassword}

                        onChange={(e)=>

                            setPasswordData({

                                ...passwordData,

                                currentPassword:e.target.value

                            })

                        }

                    />



                    <br/><br/>





                    <input

                        type="password"

                        placeholder="New Password"

                        value={passwordData.newPassword}

                        onChange={(e)=>

                            setPasswordData({

                                ...passwordData,

                                newPassword:e.target.value

                            })

                        }

                    />



                    <br/><br/>





                    <input

                        type="password"

                        placeholder="Confirm New Password"

                        value={passwordData.confirmPassword}

                        onChange={(e)=>

                            setPasswordData({

                                ...passwordData,

                                confirmPassword:e.target.value

                            })

                        }

                    />



                    <br/><br/>





                    <button onClick={handlePasswordChange}>


                        Change Password 🔒


                    </button>




                </div>


            )


            :


            (


                <p>

                    No tuition centre found.

                </p>


            )


            }






            <br/>





            <BackButton />




        </div>


    );


}


export default OwnerSettings;
