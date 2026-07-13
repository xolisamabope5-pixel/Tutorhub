function Register() {
  return (
    <div>
      <h1>Learner Registration</h1>

      <form>

        <input 
          type="text"
          placeholder="Name"
        />

        <input 
          type="text"
          placeholder="Surname"
        />

        <input 
          type="text"
          placeholder="Grade"
        />

        <input 
          type="text"
          placeholder="School"
        />

        <input
          type="text"
          placeholder="Subjects (e.g Maths, Physics)"
        />
       
       <label>
        Upload Proof of Payment (EFT screenshot or PDF)

       <input
         type="file"
        />
       </label>

       <input
         type="text"
         placeholder="Create Username"
        />

       <input
         type="password"
         placeholder="Create Password"
        />

        <button>
          Create Account
        </button>

      </form>
    </div>
  )
}

export default Register