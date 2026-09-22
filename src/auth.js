import { ref } from 'vue'

export const isAuthenticated = ref(false)

export function login(username, password) {
  isAuthenticated.value =
    username === 'admin' && password === 'Library123!'

  return isAuthenticated.value
}

export function logout() {
  isAuthenticated.value = false
}