<template>
  <q-page class="container-camera q-pa-md">
    <div class="camera-frame q-pa-md">
      <video ref="video" class="full-width" autoplay v-show="!imageCaptured" />
      <canvas
        ref="canvas"
        class="full-width"
        height="240"
        v-show="imageCaptured"
      />
    </div>
    <div class="text-center q-pa-md">
      <q-btn
        v-if="hasCameraSupports"
        round
        color="grey-10"
        icon="eva-camera"
        :disable="imageCaptured"
        @click="captureImage"
      />
      <q-file
        v-else
        outlined
        v-model="imageUpload"
        label="Choose an image"
        accept="image/*"
        @input="captureImageFallback"
      >
        <template v-slot:prepend>
          <q-icon name="eva-attach-outline" />
        </template>
      </q-file>
      <div class="row justify-center q-pa-md">
        <q-input
          v-model="post.caption"
          label="Caption *"
          class="col col-sm-6"
          dense
        />
      </div>
      <div class="row justify-center q-pa-md">
        <q-input
          v-model="post.location"
          label="Location"
          class="col col-sm-6"
          dense
          :loading="locationLoading"
        >
          <template v-slot:append>
            <q-btn
              v-if="!locationLoading && islocationSupported"
              round
              dense
              flat
              icon="eva-navigation-2-outline"
              @click="getLocation"
            />
          </template>
        </q-input>
      </div>
      <div class="row justify-center q-mt-lg">
        <q-btn
          rounded
          unelevated
          color="primary"
          label="Post image"
          :disable="!post.caption || !post.photo"
          @click="addPost"
        />
      </div>
    </div>
  </q-page>
</template>

<script>
import {uid} from 'quasar'

require('md-gum-polyfill');

export default {
  name: "PageCamera",
  data() {
    return {
      post: {
        id: uid(),
        caption: "",
        date: Date.now(),
        location: "",
        photo: null
      },
      imageCaptured: false,
      hasCameraSupports: true,
      imageUpload: [],
      locationLoading: false
    }
  },
  computed: {
    islocationSupported() {
      return navigator.geolocation ? true : false
    }
  },
  methods: {
    initCamera() {
      navigator.mediaDevices.getUserMedia({
        video: true
      }).then(stream => {
        this.$refs.video.srcObject = stream;
      }).catch((e) => {
        this.hasCameraSupports = false
      })
    },
    captureImage() {
      let video = this.$refs.video;
      let canvas = this.$refs.canvas;

      canvas.width = video.getBoundingClientRect().width;
      canvas.height = video.getBoundingClientRect().height;
      let context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      this.imageCaptured = true;
      this.post.photo = this.dataURItoBlob(canvas.toDataURL());
      this.disableCamera();
    },
    dataURItoBlob(dataURI) {
      // convert base64 to raw binary data held in a string
      // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
      const byteString = atob(dataURI.split(',')[1]);

      // separate out the mime component
      const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

      // write the bytes of the string to an ArrayBuffer
      const ab = new ArrayBuffer(byteString.length);

      // create a view into the buffer
      const ia = new Uint8Array(ab);

      // set the bytes of the buffer to the correct values
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      // write the ArrayBuffer to a blob, and you're done
      return new Blob([ab], {type: mimeString});

    },
    captureImageFallback(file) {
      this.post.photo = file
      let canvas = this.$refs.canvas;
      let context = canvas.getContext('2d');

      const reader = new FileReader();
      reader.onload = event => {
        let img = new Image()
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0)
          this.imageCaptured = true;
        }
        img.src = event.target.result;
      }
      reader.readAsDataURL(file)
    },
    disableCamera() {
      this.$refs.video.srcObject.getTracks().forEach(track => track.stop());
    },
    getLocation() {
      this.locationLoading = true
      navigator.geolocation.getCurrentPosition(position => {
        this.getCityAndCountry(position)
      }, err => {
        this.locationError(err);
      }, {timeout: 7000})
    },
    getCityAndCountry(position) {
      const apiUrl = `https://geocode.xyz/${position.coords.latitude},${position.coords.longitude}?json=1`;
      this.$axios.get(apiUrl).then(res => {
        this.locationSuccess(res)
      }).catch(e => {
        this.locationError(e);
      })
    },
    locationSuccess(res) {
      this.post.location = res.data.city;
      if (res.data.country) {
        this.post.location += `, ${res.data.country}`
      }
      this.locationLoading = false
    },
    locationError(err) {
      this.$q.dialog({
        title: 'Error',
        message: "Could not find your location"
      })
      this.locationLoading = false
    },
    addPost() {
      this.$q.loading.show();
      let formData = new FormData();
      formData.append('id', this.post.id);
      formData.append('caption', this.post.caption);
      formData.append('location', this.post.location);
      formData.append('date', this.post.date);
      formData.append('file', this.post.photo,`${this.post.id}.png`);

      this.$axios.post(`${process.env.API}/createPost`, formData)
        .then(response => {
          console.log(response)
          this.$q.notify({
            message: 'Post created.',
            actions: [
              {
                label: 'Dismiss', color: 'white'
              }
            ]
          });
          this.$router.push('/');
        })
        .catch(err => {
          this.$q.dialog({
            title: 'Error',
            message: "Could not create post"
          })
        })
      .finally(() => this.$q.loading.hide())
    }
  },
  mounted() {
    this.initCamera();
  },
  beforeDestroy() {
    if (this.hasCameraSupports) {
      this.disableCamera();
    }
  }
}
</script>

<style scoped lang="scss">
.camera-frame {
  border: 2px solid $grey-10;
  border-radius: 10px;
}
</style>
