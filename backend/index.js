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
const webpush = require('web-push');

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

/**
 * webpush
 */
webpush.setVapidDetails(
  'mailto:example@yourdomain.org',
  'BPujNL--RxZkXxcBzXqBhJpeBe9qbkkZcL3ed4zDIFHOkFH69tBNsNdcxwQGvbQPrWklDQdb_vUvXXN4E0yKT3M', //public
  'Rb0lz4yX8RHMN9-USqZ6-_tkBcVWOch3hUfuKh_LQXs', //private
);

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
          response.end('Post added');
          sendPushNotification();
        })
        .catch((err) => console.log(err));
    }

    function sendPushNotification() {
      const subscriptions = [];
      db.collection('subscriptions')
        .get()
        .then((snapshot) => {
          snapshot.forEach((doc) => {
            subscriptions.push(doc.data());
          });
          return subscriptions;
        })
        .then((subscriptions) => {
          subscriptions.forEach((subscription) => {
            const { endpoint, keys } = subscription;
            const pushSubscription = { endpoint, keys };
            const pushContent = {
              title: 'New Quasagramm post!',
              body: 'New Post added!',
              openUrl: '/#/',
            };

            webpush.sendNotification(
              pushSubscription,
              JSON.stringify(pushContent),
            ).catch(e => console.log(e.toString()))
          });
        })
        .catch((e) => console.log(e));
    }
  });

  request.pipe(busboy);
});

app.post('/createSubscription', function (request, response) {
  response.set('Access-Control-Allow-Origin', '*');
  db.collection('subscriptions')
    .add(request.query)
    .then((docRef) => {
      response.send({
        message: 'Subscription added',
        postData: request.query,
      });
    });
});

/*
 * Listen
 */
app.listen(process.env.PORT || 3000);
