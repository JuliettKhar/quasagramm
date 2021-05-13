/*
* Dependencies
*/
var express = require('express');

/*
* Config - express
*/
var app = express();

/*
* Endpoints
*/
app.get('/posts', function(request, response) {
  const posts = [
        {
          id: 1,
          caption: "Golden Gate Bridge",
          date: 1620641711881,
          location: "San Francisco, United States",
          imageURL: "https://cdn.quasar.dev/img/parallax1.jpg"
        },
        {
          id: 2,
          caption: "Golden Gate Bridge",
          date: 1620641711881,
          location: "San Francisco, United States",
          imageURL: "https://cdn.quasar.dev/img/parallax1.jpg"
        },
        {
          id: 3,
          caption: "Golden Gate Bridge",
          date: 1620641711881,
          location: "San Francisco, United States",
          imageURL: "https://cdn.quasar.dev/img/parallax1.jpg"
        }
      ]
  response.send(posts);
});

/*
* Listen
*/
app.listen(process.env.PORT ||3000)
