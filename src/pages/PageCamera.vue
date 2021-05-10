<template>
  <q-page class="container-camera q-pa-md">
    <div class="camera-frame q-pa-md">
      <img src="https://cdn.quasar.dev/img/parallax1.jpg" alt="" class="full-width">
    </div>
    <div class="text-center q-pa-md">
      <q-btn round color="grey-10" icon="eva-camera"/>
      <div class="row justify-center q-pa-md">
        <q-input v-model="post.caption" label="Caption" class="col col-sm-6" dense/>
      </div>
      <div class="row justify-center q-pa-md">
        <q-input v-model="post.location" label="Location" class="col col-sm-6" dense>
          <template v-slot:append>
            <q-btn round dense flat icon="eva-navigation-2-outline"/>
          </template>
        </q-input>
      </div>
      <div class="row justify-center q-mt-lg">
        <q-btn rounded unelevated color="primary" label="Post image"/>
      </div>
    </div>
  </q-page>
</template>

<script>
import { uid } from 'quasar'
export default {
  name: "PageCamera",
  data() {
    return {
      post: {
        id: uid(),
        caption: "",
        date: 0,
        location: "",
        photo: null
      },
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
