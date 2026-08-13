import "./DashboardBox.css";


function DashboardBox({icon, title, description, onClick}){


    return(

        <div 
        className="dashboard-box"
        onClick={onClick}
        >


            <h2>
                {icon}
            </h2>


            <h3>
                {title}
            </h3>


            <p>
                {description}
            </p>


        </div>

    );


}


export default DashboardBox;