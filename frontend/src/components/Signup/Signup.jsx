import React from "react";
// import style from "./login.css"
import "./login.css"
import { useState, useEffect } from "react";
import {Submit} from "../Submit/Submit"
import { Link, useNavigate } from "react-router-dom";
import { Bounce, ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "../Submit/Submit.css"
import { useAuth } from "../../contexts/AuthContext";







function Signup({leftimg, logo, line1, line2, paragraph}){
    const { signup, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate("/dashboard");
        }
    }, [isAuthenticated, navigate]);

//javascript

const [name, setName] = useState("")
const [password, setPassword] = useState("")
const [email, setEmail] = useState("")
const [role, setRole] = useState("entrepreneur") // Default role
const [loading, setLoading] = useState(false)
//call

function passwordError(){
    toast.error('Password must be greater than 8 characters', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
        transition: Bounce,
        });
}
function userAlreadyExist(){
    toast.error('User already exists', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
        transition: Bounce,
        });
}


function sucess() {
    toast.success('Signup Succesfully', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
        transition: Bounce,
        });
};

const register = async (e) => {
    e.preventDefault();
    
    if(password.length < 8){
        passwordError();
        return;
    }
    
    if (!name.trim() || !email.trim() || !password.trim()) {
        toast.error('Please fill in all fields');
        return;
    }
    
    setLoading(true);
    
    console.log('🚀 Signup form data:', {
        name: name,
        email: email,
        password: password ? '[REDACTED]' : 'EMPTY',
        role: role
    });
    
    try {
        const result = await signup(name, email, password, role); // name is used as username
        
        if (result.success) {
            if (result.requiresVerification) {
                sucess();
                toast.info('Please check your email to verify your account.');
                // Redirect to email verification page
                navigate(`/verify-email?email=${encodeURIComponent(email)}`);
            } else {
                // User is already verified and authenticated
                sucess();
                navigate('/dashboard');
            }
        } else {
            console.log('❌ Signup failed with result:', result);
            if (result.error === "User already exists" || result.error?.includes('already exists')) {
                userAlreadyExist();
            } else {
                toast.error(result.error || 'Signup failed');
            }
        }
    } catch (error) {
        console.error("Signup failed:", error);
        toast.error('Signup failed');
    } finally {
        setLoading(false);
    }
}


//Checking if fields are filled
let allFieldsFill = (e)=>{
   
   
    return name.trim() !== "" && password.trim() !== "" && email.trim() !== "";
}




return(
    <>
    <div className="main">

<div className="left">
<div className="leftimg"><img src="./loginPage.png" alt="" /></div>
<div className="head">
    <h1>{line1}</h1>
    <br />
    <h1>{line2}</h1>
    <br />
    <p>{paragraph}</p>
</div>
</div>


    <div className="right" style={{height: "fit-content"}}>
<div className="loginbox">
    <img src="../../../images/logolight.png" alt="" className="logoimg" />
<div className="logo"></div>


    <label htmlFor="username">Username</label>
    <input type="text" placeholder="Enter Full Name" className="inp emailinp txt" autoComplete="on" onChange={(e)=>{setName(e.target.value)}}/>


    <label htmlFor="email">Email</label>
    <input type="email" placeholder="Enter Email Here" className="inp email" autoComplete="on" onChange={(e)=>{setEmail(e.target.value)}}/>


    <label htmlFor="password" >Password</label>
    <input type="password" placeholder="Enter Password Here" className="inp" autoComplete="on" onChange={(e)=>{setPassword(e.target.value)}}/>

    <label htmlFor="role">Role</label>
    <select 
        className="inp" 
        value={role} 
        onChange={(e) => setRole(e.target.value)}
    >
        <option value="entrepreneur">Entrepreneur</option>
        <option value="student">Student/Professional</option>
        <option value="investor">Investor</option>
    </select>

   

    <div className="btnbox">
    <Link to="/login" className="noaccount">
    {/* <Submit btn1text={"Login"}  /> */}
    <p className="signupText">already have an account</p>
        </Link>


        {/* <Link to="/auth/signup"> */}
        <input 
  type="submit" 
  disabled={!allFieldsFill() || loading} 
  onClick={register}  
  value={loading ? "Creating Account..." : "Signup"} 
  className="btn"
/>


    </div>
</div>
    </div>
    </div>
    <ToastContainer />
    </>
);
}

export {Signup}