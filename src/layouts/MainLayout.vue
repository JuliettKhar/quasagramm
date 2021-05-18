<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-white text-grey-10" bordered>
      <q-toolbar class="container">
        <q-btn
          to="camera"
          flat
          round
          icon="eva-camera-outline"
          size="18px"
          dense
          class="large-screen-only"
        />
        <q-separator vertical spaced="8px" class="large-screen-only" />
        <q-toolbar-title class="text-grand-hotel text-bold">
          Quasagram
        </q-toolbar-title>

        <q-btn
          to="/"
          flat
          round
          icon="eva-home-outline"
          size="18px"
          dense
          class="large-screen-only"
        />
      </q-toolbar>
    </q-header>

    <q-page-container class="bg-grey-1">
      <router-view />
    </q-page-container>

    <q-footer class="bg-white" bordered>
      <transition
        appear
        enter-active-class="animated fadeIn"
        leave-active-class="animated fadeOut"
      >
        <div v-if="showAppInstallBanner" class="bg-primary banner-container">
          <div class="container">
            <q-banner inline-actions dense class="bg-primary text-white">
              <b>Install Quasagramm?</b>

              <template v-slot:action>
                <q-btn flat label="Yes" @click="installApp" />
                <q-btn
                  flat
                  label="Later"
                  @click="showAppInstallBanner = false"
                />
                <q-btn flat label="Never" @click="neverShowAppInstallBanner" />
              </template>
            </q-banner>
          </div>
        </div>
      </transition>
      <q-tabs
        class="text-grey-10 small-screen-only"
        active-color="primary"
        indicator-color="transparent"
      >
        <q-route-tab to="/" name="home" icon="eva-home-outline" label="Home" />
        <q-route-tab
          to="camera"
          name="camera"
          icon="eva-camera-outline"
          label="Camera"
        />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script>
// Initialize deferredPrompt for use later to show browser install prompt.
let deferredPrompt;

export default {
  name: 'MainLayout',
  data() {
    return {
      showAppInstallBanner: false,
    }
  },
  mounted() {
    if (!this.$q.localStorage.getItem('neverShowAppInstallBanner')) {
      window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        // Update UI notify the user they can install the PWA
        setTimeout(() =>  this.showAppInstallBanner = true, 2000)

      });
    }
  },
  methods: {
    async installApp() {
      // Hide the app provided install promotion
      this.showAppInstallBanner = false;
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const {outcome} = await deferredPrompt.userChoice;
      // Optionally, send analytics event with outcome of user choice
      if (outcome === 'accepted') {
        this.neverShowAppInstallBanner();
      } else {
        console.log(2)
      }
      console.log(`User response to the install prompt: ${outcome}`);
      // We've used the prompt, and can't use it again, throw it away
      deferredPrompt = null;
    },
    neverShowAppInstallBanner() {
      this.showAppInstallBanner = false;
      this.$q.localStorage.set('neverShowAppInstallBanner', true);
    }
  }
}
</script>
<style lang="scss">
.q-toolbar {
  @media (min-width: $breakpoint-sm-min) {
    height: 77px;
  }
}

.q-tab__content > i.q-tab__icon {
  font-size: 30px;
}

.q-toolbar__title {
  font-size: 30px;
  @media (max-width: $breakpoint-xs-max) {
    text-align: center;
  }
}
</style>
