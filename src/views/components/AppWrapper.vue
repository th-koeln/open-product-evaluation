<template>
  <div>
    <app-navigation />

    <div class="container content">
      <router-view />

      <opensource />
    </div>
  </div>
</template>

<script>
import AppNavigation from '@/components/AppNavigation.vue'
import OpenSourceNote from '@/components/misc/OpenSourceNote.vue'

export default {
  name: 'AppWrapper',
  components: {
    'app-navigation': AppNavigation,
    opensource: OpenSourceNote,
  },
}
</script>

<style scoped="true" lang="scss">

  .container { margin-bottom: 1.5rem; }

  .content {

    >.form {
      max-width: 690px;
      margin: 0 auto;

      +.footer {
        max-width: 690px;
        margin: 0 auto;
      }
    }

    &::before {
      position: absolute;
      left: 0;
      width: 100%;
      height: 200px;
      content: '';
      background: $secondaryColor;
      z-index: -1;
      margin-top: -2rem;
    }
  }

  @media print {
    .container {
      padding: 0;

      .form {
        max-width: none;
      }
    }
    .content::before {
      background: #ffffff !important;
    }
  }

</style>
