<template>
  <q-page class="container q-pa-md">
    <div class="row q-col-gutter-lg">
      <div class="col-12 col-sm-8">
        <q-card
          class="card-post q-mb-md"
          flat
          bordered
          v-for="post in posts"
          :key="post.id"
        >
          <q-item>
            <q-item-section avatar>
              <q-avatar>
                <img src="https://cdn.quasar.dev/img/boy-avatar.png">
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-bold">User Name</q-item-label>
              <q-item-label caption>{{ post.location }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator/>
          <q-img
            class="col-5"
            :src="post.imageURL"
          />
          <q-card-section class="q-pt-xs">
            <div>{{ post.caption }}</div>
            <div class="text-caption text-grey">{{ formatDate(post.date) }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-4 large-screen-only">
        <q-item class="fixed">
            <q-item-section avatar>
              <q-avatar size="48px">
                <img src="https://cdn.quasar.dev/img/boy-avatar.png">
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-bold">User Name</q-item-label>
              <q-item-label caption> Location</q-item-label>
            </q-item-section>
          </q-item>
      </div>
    </div>
  </q-page>
</template>

<script>
import {date} from 'quasar'

export default {
  name: 'PageHome',
  data() {
    return {
      posts: [
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
    }
  },
  methods: {
    formatDate(value) {
      return date.formatDate(value, 'YYYY-MMMM-D h:mmA')
    }
  }
}
</script>
<style lang="scss">
.card-post .q-img {
  min-height: 200px;
}
</style>
