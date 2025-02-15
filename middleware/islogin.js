function islogin(req,res,next) {
    if( req.isAuthenticated()){
     
     console.log("accepted");
     
     next();
    }else {   console.log("rejected");  res.redirect("/")}
    
 }
 module.exports=islogin;