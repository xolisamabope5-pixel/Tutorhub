function DashboardCard({icon,title,value,onClick}){


return(

<div

onClick={onClick}

style={{

border:"1px solid #ccc",

padding:"20px",

borderRadius:"15px",

cursor:"pointer",

width:"200px"

}}

>


<h1>{icon}</h1>


<h3>

{title}

</h3>


<h2>

{value}

</h2>


</div>


);


}


export default DashboardCard;