<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-white text-grey-10" bordered>
      <q-toolbar class="container">
        <q-btn
          to="camera"
          flat round
          icon="eva-camera-outline"
          size="18px"
          dense
          class="large-screen-only"
        />
         <q-separator vertical spaced="8px" class="large-screen-only"/>
        <q-toolbar-title class="text-grand-hotel text-bold">
          Quasagram
        </q-toolbar-title>

        <q-btn
          to="/"
          flat round
          icon="eva-home-outline"
          size="18px"
          dense
          class="large-screen-only"
        />

      </q-toolbar>
    </q-header>

    <q-page-container class="bg-grey-1">
      <router-view/>
    </q-page-container>

    <q-footer class="bg-white small-screen-only" bordered>
      <q-tabs class="text-grey-10" active-color="primary" indicator-color="transparent">
        <q-route-tab to="/" name="home" icon="eva-home-outline" label="Home"/>
        <q-route-tab to="camera" name="camera" icon="eva-camera-outline" label="Camera"/>
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script>
export default {
  name: 'MainLayout',
  data() {
    return {
      leftDrawerOpen: false,
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
