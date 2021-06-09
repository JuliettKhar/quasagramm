<template>
  <q-page class="container q-pa-md">
    <transition
      appear
      enter-active-class="animated fadeIn"
      leave-active-class="animated fadeOut"
    >
      <div
        v-if="showNotificationBanner && isPushNotificationsSupported"
        class="bg-primary banner-container"
      >
        <div class="container">
          <q-banner dense class="bg-grey-3 q-mb-md">
            <template v-slot:avatar>
              <q-icon name="eva-bell-outline" color="primary"></q-icon>
            </template>
            Would you like to enable notifications?

            <template v-slot:action>
              <q-btn
                flat
                label="Yes"
                @click="enableNotifications"
                color="primary"
              />
              <q-btn
                flat
                label="Later"
                @click="showNotificationBanner = false"
                color="primary"
              />
              <q-btn
                flat
                label="Never"
                @click="neverShowNotificationBanner"
                color="primary"
              />
            </template>
          </q-banner>
        </div>
      </div>
    </transition>

    <div class="row q-col-gutter-lg">
      <div class="col-12 col-sm-8">
        <template v-if="!loadingPosts && posts.length">
          <q-card
            :class="['card-post', 'q-mb-md', post.offline ? 'bg-red-1' : '']"
            flat
            bordered
            v-for="post in posts"
            :key="post.id"
          >
            <q-item>
              <q-badge
                v-if="post.offline"
                color="red"
                class="badge-offline absolute-top-right"
              >
                Stored offline
              </q-badge>
              <q-item-section avatar>
                <q-avatar>
                  <img src="https://cdn.quasar.dev/img/boy-avatar.png" alt="" />
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-bold">User Name</q-item-label>
                <q-item-label caption>{{ post.location }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-separator />
            <q-img class="col-5" :src="post.imageUrl" />
            {{ post.imageURL }}
            <q-card-section class="q-pt-xs">
              <div>{{ post.caption }}</div>
              <div class="text-caption text-grey">
                {{ formatDate(post.date) }}
              </div>
            </q-card-section>
          </q-card>
        </template>
        <template v-else-if="!loadingPosts && !posts.length">
          <h5 class="text-center text-grey">No posts yet.</h5>
        </template>
        <template v-else>
          <div class="q-pa-md">
            <q-card flat bordered>
              <q-item>
                <q-item-section avatar>
                  <q-skeleton type="QAvatar" animation="fade" size="40px" />
                </q-item-section>

                <q-item-section>
                  <q-item-label>
                    <q-skeleton type="text" animation="fade" />
                  </q-item-label>
                  <q-item-label caption>
                    <q-skeleton type="text" animation="fade" />
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-skeleton height="200px" square animation="fade" />

              <q-card-section>
                <q-skeleton
                  type="text"
                  class="text-subtitle2"
                  animation="fade"
                />
                <q-skeleton
                  type="text"
                  width="50%"
                  class="text-subtitle2"
                  animation="fade"
                />
              </q-card-section>
            </q-card>
          </div>
        </template>
      </div>
      <div class="col-4 large-screen-only">
        <q-item class="fixed">
          <q-item-section avatar>
            <q-avatar size="48px">
              <img src="https://cdn.quasar.dev/img/boy-avatar.png" alt="" />
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
import {openDB} from 'idb';
import {isOnline} from "src/utils/onlineChecker";
const qs = require('qs');

export default {
  name: 'PageHome',
  data() {
    return {
      posts: [],
      loadingPosts: false,
      showNotificationBanner: false
    }
  },
  computed: {
    isServiceWorkerSupported: () => 'serviceWorker' in navigator,
    isPushNotificationsSupported: () => 'PushManager' in window,
  },
  methods: {
    isOnline,
    formatDate(value) {
      return date.formatDate(value, 'YYYY-MMMM-D h:mmA')
    },
    async getPosts() {
      this.loadingPosts = true;
      const isOffline = await isOnline();
      let  timestamp = '';

      // add unique timestamp for the request URL for IE
      if (this.$q.platform.is.ie) {
        timestamp = `?timestamp=${Date.now()}`
      }

      this.$axios.get(`${process.env.API}/posts${timestamp}`)
        .then(response => {
          this.posts = response.data;
          this.loadingPosts = false;

          if (isOffline) {
            this.getOfflinePosts();
          }
        })
        .catch(() => {
          this.$q.dialog({
            title: 'Error',
            message: "Could not load posts"
          })
        })
        .finally(() => {
          this.loadingPosts = false;
        })
    },
    getOfflinePosts() {
      openDB('workbox-background-sync').then(db => {
        db.getAll('requests').then(failedRequests => {
          failedRequests.forEach(failedRequest => {
            if (failedRequest.queueName === 'createPostQueue') {
              const request = new Request(failedRequest.requestData.url, failedRequest.requestData);
              request.formData().then(formData => {
                let offlinePost = {};
                offlinePost.id = formData.get('id');
                offlinePost.caption = formData.get('caption');
                offlinePost.location = formData.get('location');
                offlinePost.date = parseInt(formData.get('date'), 10);
                offlinePost.offline = true;

                const reader = new FileReader();
                reader.readAsDataURL(formData.get('file'));
                reader.onloadend = () => {
                  offlinePost.imageUrl = reader.result;
                  this.posts.unshift(offlinePost);
                };
              })
            }
          })
        }).catch(e => console.log(e))
      }).catch(e => console.log(e))
    },
    listenForOfflinePostsUploaded() {
      if (this.isServiceWorkerSupported) {
        const channel = new BroadcastChannel('sw-messages');
        channel.addEventListener('message', event => {
          if (event.data.msg === 'offline-post-uploaded') {
            const offlinePostCount = this.posts.filter(post => post.offline).length;
            this.posts[offlinePostCount - 1].offline = false;
          }
          console.log('Received', event.data);
        });
      }
    },
    enableNotifications() {
      if (this.isPushNotificationsSupported) {
        Notification.requestPermission((result) => {
          this.neverShowNotificationBanner();

          if (result === 'granted') {
            // this.displayGrantedNotification();
            this.checkForExistingPushSubscription();
          }
        })
      }
    },
    checkForExistingPushSubscription() {
      if (this.isServiceWorkerSupported && this.isPushNotificationsSupported) {
        let req;
        navigator.serviceWorker.ready.then((swReq) => {
          req = swReq
          return swReq.pushManager.getSubscription();
        }).then(sub => {
          if (!sub) {
            this.createPushSubscription(req);
          }
        })
      }
    },
    createPushSubscription(swReq) {
      const vapidPublicKey = "BPujNL--RxZkXxcBzXqBhJpeBe9qbkkZcL3ed4zDIFHOkFH69tBNsNdcxwQGvbQPrWklDQdb_vUvXXN4E0yKT3M"
      const vapidPublicKeyConverted = this.urlBase64ToUint8Array(vapidPublicKey);
      swReq.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKeyConverted
      }).then(newSub =>{
        const newSubData = newSub.toJSON();
        const newSubDataQs = qs.stringify(newSubData)
        return this.$axios.post(`${process.env.API}/createSubscription?${newSubDataQs}`)
      }).then(response => {
        this.displayGrantedNotification()
      }).catch(e => {
        console.log(e)
      })
    },
    displayGrantedNotification() {
      if (this.isServiceWorkerSupported && this.isPushNotificationsSupported) {
        navigator.serviceWorker.ready.then((swReq) => {
          swReq.showNotification("You're subscribed to notification", {
            body: "Thanks for subscribing",
            // MacOs
            icon: "icons/apple-icon-120x120.png",
            // Android
            image: "icons/apple-icon-120x120.png",
            // MacOs, Android
            badge: "icons/apple-icon-120x120.png",
            dir: "ltr",
            lang: "en-US",
            vibrate: [100, 50, 200],
            tag: 'confirm-notification',
            //Android
            renotify: true,
            actions: [
              {
                title: "Hello",
                icon: "icons/apple-icon-120x120.png",
                action: "hello"
              },
              {
                title: "Goodbye",
                icon: "icons/apple-icon-120x120.png",
                action: "goodbye"
              }
            ]
          });
        })
      }
    },
    neverShowNotificationBanner() {
      this.showNotificationBanner = false;
      this.$q.localStorage.set('showNotificationBanner', true);
    },
    initNotificationBanner() {
      if (!this.$q.localStorage.getItem('showNotificationBanner')) {
        this.showNotificationBanner = true;
      }
    },
    urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }
  },
  activated() {
    this.getPosts();
  },
  created() {
    this.listenForOfflinePostsUploaded();
    this.initNotificationBanner();
  }
}
</script>
<style lang="scss">
.card-post .q-img {
  min-height: 200px;
}

.card-post .badge-offline {
  border-top-left-radius: 0;
  border-bottom-right-radius: 0;
}
</style>
