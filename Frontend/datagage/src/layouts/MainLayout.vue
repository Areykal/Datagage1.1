<template>
  <v-app>
    <!-- App Bar -->
    <v-app-bar
      app
      elevation="1"
    >
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-app-bar-title>Qwen2.5 Data Visualization</v-app-bar-title>
      <v-spacer />

      <!-- User menu -->
      <v-menu>
        <template #activator="{ props }">
          <v-btn
            icon
            v-bind="props"
          >
            <v-avatar size="36">
              <v-icon>mdi-account-circle</v-icon>
            </v-avatar>
          </v-btn>
        </template>
        <v-list>
          <v-list-item
            prepend-icon="mdi-account"
            title="Profile"
          />
          <v-list-item
            prepend-icon="mdi-cog"
            title="Settings"
            @click="$router.push('/settings')"
          />
          <v-divider />
          <v-list-item
            prepend-icon="mdi-logout"
            title="Logout"
          />
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      app
    >
      <v-list-item class="pa-4">
        <v-list-item-title class="text-h6">
          Qwen Viz
        </v-list-item-title>
        <v-list-item-subtitle>Data Insights Platform</v-list-item-subtitle>
      </v-list-item>

      <v-divider />

      <!-- Navigation links -->
      <v-list nav>
        <v-list-item
          v-for="item in navigationItems"
          :key="item.name"
          :to="item.path"
          :prepend-icon="item.meta.icon"
          :title="item.meta.title"
          :value="item.name"
        />
      </v-list>

      <template #append>
        <div class="pa-4">
          <v-btn
            block
            prepend-icon="mdi-help-circle"
          >
            Help Center
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>

    <!-- Footer -->
    <v-footer
      app
      class="d-flex flex-column"
    >
      <div>
        <span>&copy; {{ new Date().getFullYear() }} Qwen2.5 Data
          Visualization</span>
      </div>
    </v-footer>
  </v-app>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const drawer = ref(true);

// Get navigation items from router
const navigationItems = computed(() => {
  return router.options.routes
    .filter((route) => route.meta && route.meta.title)
    .map((route) => ({
      name: route.name,
      path: route.path,
      meta: route.meta,
    }));
});
</script>

<style scoped>
.v-footer {
  justify-content: center;
  text-align: center;
}
</style>
