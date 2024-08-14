const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const req = require('express/lib/request');
mongoose.connect('mongodb+srv://jong:' + process.env['PW'] + '@cluster0.9kfjt.mongodb.net/fcc-exerrcisetracker?retryWrites=true&w=majority&appName=Cluster0')

// user schema and model
let userSchema = new mongoose.Schema({
  username: { type: String, required: true }
});
let user = mongoose.model('user', userSchema);

// exercise schema and model
let exerciseSchema = new mongoose.Schema({
  //username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date },
  user_id: { type: String, required: true }
})
let exercise = mongoose.model('exercise', exerciseSchema);

let result;

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async (req, res) => {
  const username = req.body.username;
  const newUser = new user({ username: username });
  result = await newUser.save();
  console.log(result);
  res.json(result);
})

app.get('/api/users', async (req, res) => {
  allUsers = await user.find({})
  res.json(allUsers);
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;
  
  const username = await user.findById(id);
  const newExercise = new exercise({
    //username: username.username,
    description: description, 
    duration: duration, 
    date: date ? new Date(date) : new Date(),
    user_id: id
  });
  result = await newExercise.save();
  res.json({
    username: username.username, 
    description: newExercise.description, 
    duration: newExercise.duration,
    date: newExercise.date.toDateString(),
    _id: id});
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const id = req.params._id;
  const username = await user.findById(id);

  //optional queries
  const { from, to, limit } = req.query
  let dateObj = {};
  if (from){
    dateObj["$gte"] = new Date(from)
  }
  if (to){
    dateObj["$lte"] = new Date(to)
  }
  let filter = {user_id: id}
  if (from || to){filter.date = dateObj}
  
  const exerciseLogs = await exercise.find(filter).limit(+limit ?? 200);
  const logCount = await exercise.find(filter).countDocuments();
  
  const log = exerciseLogs.map(e => ({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString()
  }))

  res.json({username: username.username, count: logCount, _id: id, log})
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
