/*
 * Dependencies
 */
const express = require('express');
const admin = require('firebase-admin');
const inspect = require('util').inspect;
const path = require('path');
const os = require('os');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Busboy = require('busboy');

/*
 * Config - express
 */
const app = express();

/*
 * Config - firebase
 */
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'quickstart-1611086095598.appspot.com',
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

/*
 * Endpoints
 */
app.get('/posts', function (request, response) {
  response.set('Access-Control-Allow-Origin', '*');
  const posts = [];
  db.collection('posts')
    .orderBy('date', 'desc')
    .get()
    .then((snapshot) => {
      snapshot.forEach((doc) => {
        posts.push(doc.data());
      });
      response.send(posts);
    })
    .catch((e) => console.log(e));
});

app.post('/createPost', function (request, response) {
  response.set('Access-Control-Allow-Origin', '*');
  const busboy = new Busboy({ headers: request.headers });
  const fields = {};
  let fileData = {};
  const UUID = uuidv4();

  busboy.on('field', function (fieldname, val) {
    fields[fieldname] = val;
  });

  busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
    // /tmp/23424-ewer2342.png
    const filepath = path.join(os.tmpdir(), filename);
    file.pipe(fs.createWriteStream(filepath));
    fileData = { filepath, mimetype };
  });

  busboy.on('finish', function () {
    console.log('Done parsing form!');
    bucket.upload(
      fileData.filepath,
      {
        uploadType: 'media',
        metadata: {
          metadata: {
            contentType: fileData.mimetype,
            firebaseStorageDownloadTokens: UUID,
          },
        },
      },
      (err, uploadedFile) => {
        if (!err) {
          createDocument(uploadedFile);
        }
      },
    );

    function createDocument(uploadedFile) {
      db.collection('posts')
        .doc(fields.id)
        .set({
          id: fields.id,
          caption: fields.caption,
          location: fields.location,
          date: parseInt(fields.date),
          imageUrl: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${uploadedFile.name}?alt=media&token=${UUID}`,
        })
        .then(() => {
          // response.send('Post added');
        })
        .catch(err => {
          console.log(err, 'createDocument')
        })
    }

    // response.writeHead(303, { Connection: 'close', Location: '/' });
    response.end();
  });

  request.pipe(busboy);
});
/*
 * Listen
 */
app.listen(process.env.PORT || 3000);
