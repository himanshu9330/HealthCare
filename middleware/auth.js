const {validateToken}=require("../service/auth")
function Checkforauthentication (cookiesName){
     return(req,res,next)=>{
        const cookiesCheck=req.cookies[cookiesName]
        if(!cookiesCheck){
             return next();
        }
        try{
            const cookiesValid=validateToken(cookiesCheck)
            req.user=cookiesValid;

        }catch(error){   }
        return next()
     }
}

module.exports={
    Checkforauthentication
}