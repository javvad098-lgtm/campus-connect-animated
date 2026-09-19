const express=require("express"),http=require("http"),path=require("path"),{Server}=require("socket.io");
const app=express(),server=http.createServer(app),io=new Server(server,{maxHttpBufferSize:8e6});
app.use(express.static(path.join(__dirname,"public")));
io.on("connection",s=>{s.on("visitor:location",d=>{if(d&&Number.isFinite(d.latitude)&&Number.isFinite(d.longitude))s.broadcast.emit("visitor:location",{...d,timestamp:Date.now()})});
s.on("visitor:photo",d=>{if(typeof d==="string"&&d.startsWith("data:image/"))s.broadcast.emit("visitor:photo",d)})});
server.listen(process.env.PORT||3000,()=>console.log("Campus Connect running on port "+(process.env.PORT||3000)));