<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../auth'

const username = ref('')
const password = ref('')
const router = useRouter()

const handleLogin = () => {
  if (login(username.value, password.value)) {
    router.replace('/about')
  } else {
    router.push('/access-denied')
  }
}
</script>

<template>
  <div class="container mt-5">
    <h1>Member Login</h1>

    <form @submit.prevent="handleLogin">
      <div class="mb-3">
        <label for="login-username" class="form-label">Username</label>
        <input
          id="login-username"
          v-model="username"
          class="form-control"
          autocomplete="username"
          required
        />
      </div>

      <div class="mb-3">
        <label for="login-password" class="form-label">Password</label>
        <input
          id="login-password"
          v-model="password"
          type="password"
          class="form-control"
          autocomplete="current-password"
          required
        />
      </div>

      <button type="submit" class="btn btn-primary">Login</button>
    </form>
  </div>
</template>