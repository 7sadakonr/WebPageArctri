<script setup lang="ts">
import NavBar from './components/NavBar.vue'
import HeroSection from './components/HeroSection.vue'
import FeatureGrid from './components/FeatureGrid.vue'
import AgentsSection from './components/AgentsSection.vue'
import DownloadSection from './components/DownloadSection.vue'
import FaqSection from './components/FaqSection.vue'
import FooterSection from './components/FooterSection.vue'
</script>

<template>
  <NavBar />
  <main>
    <HeroSection />
    <FeatureGrid />
    <AgentsSection />
    <DownloadSection />
    <FaqSection />
  </main>
  <FooterSection />
</template>
