import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

import App from '../App.vue'
import DashboardView from '../views/DashboardView.vue'

describe('App', () => {
  it('renders the dashboard with the configured cities', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', name: 'dashboard', component: DashboardView }],
    })

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), router],
      },
    })
    await router.isReady()

    expect(wrapper.text()).toContain('Bangkok')
    expect(wrapper.text()).toContain('Tehran')
    expect(wrapper.text()).toContain('London')
    expect(wrapper.text()).toContain('New York')
    expect(wrapper.text()).toContain('Today')
  })
})
