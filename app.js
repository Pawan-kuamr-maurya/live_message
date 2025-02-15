const express = require('express');
const { Server } = require('socket.io');



var cron = require('node-cron');
const app = express();
const httpServer = require('http').createServer(app); // Create an HTTP server
const io = new Server(httpServer); // Pass the HTTP server instance to Socket.io

const bodyParser = require("body-parser");
const path =require("path")
const mongoose=require("mongoose");
const session =require("express-session");
const passport= require("passport")
const Localstartegy=require("passport-local");
const User=require("./model/user.js")
const Message =require("./model/message.js");
const islogin= require("./middleware/islogin.js");
const { log } = require("console");
async function main() {mongoose.connect("mongodb://127.0.0.1:27017/testchatapp");}
main().then(()=>{console.log("connect sussfull");
}).catch(()=>{console.log("database out of range");
})

app.use(session({secret:"kjdlskfsflafksdfhjsdkfjdfslf",resave:false,saveUninitialized:true}))
app.use(passport.initialize());
app.use(passport.session());
passport.use(new Localstartegy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static(path.join(__dirname,"public")));

cron.schedule('0 1 * * *', async() => {
 
  await Message.updateMany({}, { $set: { chat: [] } });
});

let messagesocketid=null;
io.on('connection', async (socket) => {
  console.log('a user connected');
  if (session.user != null) {
    const userId = session.user._id;  // Get the user ID
    const newSocketId = socket.id;   // Get the NEW socket ID

    let update = await User.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(userId) },
      { socket_id: newSocketId }
    );
 console.log(session.user);

    //  SEND THE NEW SOCKET ID BACK TO THE CLIENT IMMEDIATELY
    socket.emit("socketIdUpdate", newSocketId);

    console.log(`User ${userId} connected with socket ID: ${newSocketId}`);
  } else {
    console.log("User not authenticated, skipping socket update");
  }


  socket.on("newmessage", async(msg) => {
    console.log("emit");

    // console.log(msg);
   console.log(msg.recever_soc);


    io.to(msg.recever_soc).emit("newmessage", { msg: msg.msg, senderid: session.user._id });
  });

  socket.on('disconnect', async () => {
    console.log('user disconnected');
    if(session.user!=null){
    // Clear the socket_id in the database on disconnect
    await User.findOneAndUpdate({ _id: session.user._id }, { socket_id: null });
    console.log(`Socket ID cleared for user: ${session.user._id}`);
    }
  });
});



// Start the server



app.get('/', (req, res) => {res.render("registration.ejs") });

app.post('/',  async(req, res) => {
     let new_user = new User({
                       name:req.body.name,
                       username:req.body.username
                                });
    try{  
          let newregesteruser=await User.register(new_user,req.body.password);
     
        req.logIn(newregesteruser,(err)=>{
           if(err){ console.log(err);
                 console.log("errr during login"); 
                res.redirect("/")
            }else{ session.user= req.user; res.redirect(`/home/${session.user._id}`); } })}
  catch{
       res.redirect("/")   
      }
        
      }); 

app.get("/home/:id",islogin, async(req,res)=>{  
  session.user= req.user;
      let alluser=await User.find();
      let reqperson=(!(req.session.messageuser))?req.params.id:req.session.messageuser;
     
       let messageuser= await User.findById(reqperson);
      res.render("home.ejs",{alluser:alluser,selecteduser:messageuser,user:req.user})
  
         })


app.get("/selected/:id",islogin,async(req,res)=>{
       let selectuserid=req.params.id;
       console.log("hhhhhhhhhhhhhhhh"+selectuserid);
       
        req.session.messageuser =selectuserid;
       let data= await User.find({_id:selectuserid});
      let chat_ID = await User.aggregate([
  {
      $match: {
          _id: req.user._id,  
          'personformessage.personid': new mongoose.Types.ObjectId(selectuserid) 
      }
  },
  {
      $unwind: '$personformessage'
  },
  {
      $match: {
          'personformessage.personid': new mongoose.Types.ObjectId(selectuserid)
      }
  },
  {
      $project: {
          _id: 0,  // Exclude the user's _id
          messageid: '$personformessage.messageid'
      }
  }
]);

let message=null;
// console.log(chat_ID);
if (!chat_ID || chat_ID.length === 0) {
   console.log("no_message");
 }else{
       
        req.session.messageId=chat_ID[0].messageid ? chat_ID[0].messageid : null;

       if(req.session.messageId!=null){
        message =await Message.find({_id:req.session.messageId})
}
}
// console.log(data[0]);



let chatObject = {
  presondata:data[0],
  allchat: message ,
  person_chat_id:req.session.messageId
  
};
//console.log(chatObject);

// res.send("ok")

res.send(chatObject);
})
let savemessage=null;
app.post("/message",async(req,res)=>{
  let data=req.body;
  // console.log(data);
 
 try{ if(req.session.messageId==null){
     savemessage = new Message({
      chat: [{ message: req.body.message, from: req.user._id }]
  })
  let savedMessage = await savemessage.save();

  let messagesender = await User.findOne({ _id: req.user._id })
  messagesender.personformessage.push({ personid: req.session.messageuser, messageid: savedMessage._id })
  await messagesender.save();


 
    let messagerecever = await User.findOne({ _id: req.session.messageuser })
    messagesocketid=messagerecever._id;
   messagerecever.personformessage.push({ personid: req.user._id, messageid: savedMessage._id })
    await messagerecever.save();
           

  req.session.messageId = savedMessage._id;


  }else{
    let add_message = await Message.findById(req.session.messageId)
        add_message.chat.push({ message: req.body.message, from: req.user._id })
       savemessage=   await add_message.save();
  }

// console.log(savemessage.chat);
let resever=await User.findById(req.body.recever_id);
console.log(resever.socket_id);


  res.status(200).send({msg:savemessage.chat[savemessage.chat.length-1],rec_socketid:resever.socket_id})
}catch(e){
  console.log("eroor happen in saving message");
  res.send("somthing happen bad duringe sending message")
  
}
  
  
})
  app.get("/logout", async(req,res)=>{  
     try{
     
      await User.findByIdAndUpdate(session.user._id, { socket_id: null }, { runValidators: true });
         console.log("logout");
         
         req.logOut((err)=>{
            if(err){
                  res.redirect("/home")
                  console.log("error");  
                 }else{
                  console.log("noterror");
                  res.redirect("/");
                 }})}
                 catch(e){ res.redirect("/");}
        })
 app.get("/login",(req,res)=>{
 
    res.render("login.ejs")



  
  }   )       
app.post("/login",passport.authenticate("local",{failureRedirect:"/login"}),async(req,res)=>{ // jab vo apni id ,pass dal ke login kare
  session.user= req.user;
    res.redirect(`/home/${session.user._id}`);
})







httpServer.listen(3000, () => {
  console.log('listening on *:3000');
});