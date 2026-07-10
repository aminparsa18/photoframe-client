<script setup lang="ts">
import AgendaPanel from '@/components/AgendaPanel.vue'
import CityCard from '@/components/CityCard.vue'
import WorldClock from '@/components/WorldClock.vue'
import { cities, homeCity, homeCityId } from '@/config/cities'
import { useCalendarAutoRefresh } from '@/composables/useCalendarAutoRefresh'
import { useWeatherAutoRefresh } from '@/composables/useWeatherAutoRefresh'

useWeatherAutoRefresh()
useCalendarAutoRefresh()

const worldClockCities = cities.filter((city) => city.id !== homeCityId)
</script>

<template>
  <div class="dashboard">
    <div class="dashboard__layout">
      <CityCard class="dashboard__hero" :city="homeCity" />
      <div class="dashboard__clocks">
        <WorldClock v-for="city in worldClockCities" :key="city.id" :city="city" />
        <AgendaPanel class="dashboard__agenda" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(1rem, 2.5vw, 2.5rem);
}

.dashboard__layout {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: clamp(0.9rem, 1.8vw, 1.75rem);
}

.dashboard__clocks {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: clamp(0.9rem, 1.8vw, 1.75rem);
}

.dashboard__agenda {
  flex: 1;
  min-height: 0;
}

@media (max-aspect-ratio: 4/3) {
  .dashboard__layout {
    grid-template-columns: 1fr;
    grid-template-rows: 1.4fr 1fr;
  }

  .dashboard__clocks {
    flex-direction: row;
  }

  .dashboard__agenda {
    flex: 1;
  }
}
</style>
