<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth'
import {
  doc,
  getDoc
} from 'firebase/firestore'
import {
  auth,
  db
} from '../firebase/firebase.js'

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)
const currentUser = ref(null)

const router = useRouter()

const handleLogin = async () => {
  errorMessage.value = ''
  currentUser.value = null
  isLoading.value = true

  try {
    // Authenticate the user with Firebase Authentication.
    const userCredential =
      await signInWithEmailAndPassword(
        auth,
        email.value.trim(),
        password.value
      )

    const user = userCredential.user

    // Get the user's role from Firestore.
    const userDocument = await getDoc(
      doc(db, 'users', user.uid)
    )

    const savedRole = userDocument.exists()
      ? userDocument.data().role
      : 'user'

    // Only accept roles used by this application.
    const allowedRoles = [
      'user',
      'admin'
    ]

    const role = allowedRoles.includes(savedRole)
      ? savedRole
      : 'user'

    currentUser.value = {
      uid: user.uid,
      email: user.email,
      displayName:
        user.displayName || 'Not provided',
      emailVerified: user.emailVerified,
      role
    }

    console.log(
      'Current Firebase user:',
      user
    )

    console.log(
      'Current user role:',
      role
    )
  } catch (error) {
    console.error(
      'Firebase login failed:',
      error.code
    )

    if (error.code === 'auth/invalid-email') {
      errorMessage.value =
        'Please enter a valid email address.'
    } else if (
      error.code === 'auth/too-many-requests'
    ) {
      errorMessage.value =
        'Too many attempts. Please try again later.'
    } else {
      // Do not reveal whether the account exists.
      errorMessage.value =
        'Incorrect email or password.'
    }
  } finally {
    isLoading.value = false
  }
}

const handleLogout = async () => {
  errorMessage.value = ''

  try {
    await signOut(auth)

    currentUser.value = null
    email.value = ''
    password.value = ''

    console.log('User logged out.')
  } catch (error) {
    console.error(
      'Firebase logout failed:',
      error
    )

    errorMessage.value =
      'Logout failed. Please try again.'
  }
}

const continueToAbout = async () => {
  await router.replace('/about')
}
</script>

<template>
  <div class="container mt-5">
    <div class="row">
      <div class="col-md-6 offset-md-3">
        <h1 class="text-center">
          Member Login
        </h1>

        <p class="text-center text-muted">
          User and administrator login
        </p>

        <div
          v-if="errorMessage"
          class="alert alert-danger"
          role="alert"
        >
          {{ errorMessage }}
        </div>

        <!-- Current logged-in user -->
        <div
          v-if="currentUser"
          class="alert alert-success mt-3"
          role="status"
        >
          <h2 class="h5">
            Login successful
          </h2>

          <p>
            <strong>Current user:</strong>
            {{ currentUser.email }}
          </p>

          <p>
            <strong>UID:</strong>
            {{ currentUser.uid }}
          </p>

          <p>
            <strong>Name:</strong>
            {{ currentUser.displayName }}
          </p>

          <p>
            <strong>Role:</strong>

            <span
              class="badge ms-1"
              :class="{
                'bg-primary':
                  currentUser.role === 'user',
                'bg-danger':
                  currentUser.role === 'admin'
              }"
            >
              {{ currentUser.role }}
            </span>
          </p>

          <p>
            <strong>Email verified:</strong>
            {{
              currentUser.emailVerified
                ? 'Yes'
                : 'No'
            }}
          </p>

          <button
            type="button"
            class="btn btn-success me-2"
            @click="continueToAbout"
          >
            Continue
          </button>

          <button
            type="button"
            class="btn btn-outline-danger"
            @click="handleLogout"
          >
            Logout
          </button>
        </div>

        <!-- Login form -->
        <form
          v-else
          @submit.prevent="handleLogin"
        >
          <div class="mb-3">
            <label
              for="login-email"
              class="form-label"
            >
              Email
            </label>

            <input
              id="login-email"
              v-model.trim="email"
              type="email"
              class="form-control"
              autocomplete="email"
              required
            />
          </div>

          <div class="mb-3">
            <label
              for="login-password"
              class="form-label"
            >
              Password
            </label>

            <input
              id="login-password"
              v-model="password"
              type="password"
              class="form-control"
              autocomplete="current-password"
              required
              minlength="6"
            />
          </div>

          <button
            type="submit"
            class="btn btn-primary"
            :disabled="isLoading"
          >
            {{
              isLoading
                ? 'Logging in...'
                : 'Login'
            }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 800px;
}

.alert p {
  margin-bottom: 0.5rem;
}

.badge {
  text-transform: capitalize;
}
</style>