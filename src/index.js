import express from 'express';

const app = express();

app.use(express.json());

app.get('/health', (req,res)=> {
  res.send("all working");
})

app.listen(3000, () => {
  console.log("server is running on port 3000");
})