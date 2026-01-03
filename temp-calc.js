require('dotenv').config({path:'./apps/admin/.env.local'});
const fetch = require('node-fetch');
(async()=>{
  const res = await fetch('http://localhost:3002/api/tournaments/3bf785ea-f600-467e-85d0-be711914369a/competitions/calculate-times', {
    method: 'POST'
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
})()
