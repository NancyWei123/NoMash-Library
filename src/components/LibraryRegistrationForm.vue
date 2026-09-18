<script setup>
import { ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/firebase.js'

const formData = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  isAustralian: false,
  reason: '',
  gender: ''
})

const errors = ref({
  username: null,
  email: null,
  password: null,
  confirmPassword: null,
  gender: null,
  reason: null,
  firebase: null
})

const submittedCards = ref([])
const isSubmitting = ref(false)
const successMessage = ref('')

const validateName = (blur) => {
  const username = formData.value.username.trim()

  if (username.length < 3) {
    if (blur) {
      errors.value.username = 'Name must be at least 3 characters.'
    }
  } else {
    errors.value.username = null
  }
}

const validateEmail = (blur) => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailPattern.test(formData.value.email.trim())) {
    if (blur) {
      errors.value.email = 'Please enter a valid email address.'
    }
  } else {
    errors.value.email = null
  }
}

const validatePassword = (blur) => {
  const password = formData.value.password
  const minLength = 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialCharacter = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  if (password.length < minLength) {
    if (blur) {
      errors.value.password =
        `Password must be at least ${minLength} characters long.`
    }
  } else if (!hasUppercase) {
    if (blur) {
      errors.value.password =
        'Password must contain at least one uppercase letter.'
    }
  } else if (!hasLowercase) {
    if (blur) {
      errors.value.password =
        'Password must contain at least one lowercase letter.'
    }
  } else if (!hasNumber) {
    if (blur) {
      errors.value.password =
        'Password must contain at least one number.'
    }
  } else if (!hasSpecialCharacter) {
    if (blur) {
      errors.value.password =
        'Password must contain at least one special character.'
    }
  } else {
    errors.value.password = null
  }
}

const validateConfirmPassword = (blur) => {
  if (
    formData.value.password !==
    formData.value.confirmPassword
  ) {
    if (blur) {
      errors.value.confirmPassword = 'Passwords do not match.'
    }
  } else {
    errors.value.confirmPassword = null
  }
}

const validateGender = (blur) => {
  if (!formData.value.gender) {
    if (blur) {
      errors.value.gender = 'Please select your gender.'
    }
  } else {
    errors.value.gender = null
  }
}

const validateReason = (blur) => {
  const reason = formData.value.reason.trim()

  if (reason.length < 10) {
    if (blur) {
      errors.value.reason =
        'Reason must be at least 10 characters.'
    }
  } else {
    errors.value.reason = null
  }
}

const clearForm = () => {
  formData.value = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    isAustralian: false,
    reason: '',
    gender: ''
  }

  errors.value = {
    username: null,
    email: null,
    password: null,
    confirmPassword: null,
    gender: null,
    reason: null,
    firebase: null
  }
}

const getFirebaseErrorMessage = (errorCode) => {
  if (errorCode === 'auth/email-already-in-use') {
    return 'This email address is already registered.'
  }

  if (errorCode === 'auth/invalid-email') {
    return 'The email address is invalid.'
  }

  if (errorCode === 'auth/weak-password') {
    return 'The password is too weak.'
  }

  if (errorCode === 'auth/operation-not-allowed') {
    return 'Email and password registration is not enabled.'
  }

  return 'Registration failed. Please try again.'
}

const submitForm = async () => {
  successMessage.value = ''
  errors.value.firebase = null

  validateName(true)
  validateEmail(true)
  validatePassword(true)
  validateConfirmPassword(true)
  validateGender(true)
  validateReason(true)

  const hasErrors =
    errors.value.username ||
    errors.value.email ||
    errors.value.password ||
    errors.value.confirmPassword ||
    errors.value.gender ||
    errors.value.reason

  if (hasErrors) {
    return
  }

  isSubmitting.value = true

  try {
    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        formData.value.email.trim(),
        formData.value.password
      )

    const user = userCredential.user

    await updateProfile(user, {
      displayName: formData.value.username.trim()
    })

    const profile = {
      uid: user.uid,
      username: formData.value.username.trim(),
      email: formData.value.email.trim(),
      isAustralian: formData.value.isAustralian,
      gender: formData.value.gender,
      reason: formData.value.reason.trim(),
      role: 'user',
      createdAt: serverTimestamp()
    }

    await setDoc(doc(db, 'users', user.uid), profile)

    submittedCards.value.push({
      uid: user.uid,
      username: profile.username,
      email: profile.email,
      isAustralian: profile.isAustralian,
      gender: profile.gender,
      reason: profile.reason
    })

    successMessage.value = 'Registration successful.'
    clearForm()
  } catch (error) {
    console.error('Firebase registration error:', error)
    errors.value.firebase =
      getFirebaseErrorMessage(error.code)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="container mt-5">
    <div class="row">
      <div class="col-md-8 offset-md-2">
        <h1 class="text-center">
          🗄️ Library Registration Form
        </h1>

        <p class="text-center">
          Register an account using Firebase Authentication.
        </p>

        <div
          v-if="successMessage"
          class="alert alert-success"
          role="alert"
        >
          {{ successMessage }}
        </div>

        <div
          v-if="errors.firebase"
          class="alert alert-danger"
          role="alert"
        >
          {{ errors.firebase }}
        </div>

        <form @submit.prevent="submitForm">
          <div class="row mb-3">
            <div class="col-md-6">
              <label
                for="username"
                class="form-label"
              >
                Username
              </label>

              <input
                id="username"
                v-model.trim="formData.username"
                type="text"
                class="form-control"
                autocomplete="name"
                required
                @blur="validateName(true)"
                @input="validateName(false)"
              />

              <div
                v-if="errors.username"
                class="text-danger"
              >
                {{ errors.username }}
              </div>
            </div>

            <div class="col-md-6">
              <label
                for="email"
                class="form-label"
              >
                Email
              </label>

              <input
                id="email"
                v-model.trim="formData.email"
                type="email"
                class="form-control"
                autocomplete="email"
                required
                @blur="validateEmail(true)"
                @input="validateEmail(false)"
              />

              <div
                v-if="errors.email"
                class="text-danger"
              >
                {{ errors.email }}
              </div>
            </div>
          </div>

          <div class="row mb-3">
            <div class="col-md-6">
              <label
                for="password"
                class="form-label"
              >
                Password
              </label>

              <input
                id="password"
                v-model="formData.password"
                type="password"
                class="form-control"
                autocomplete="new-password"
                required
                @blur="validatePassword(true)"
                @input="validatePassword(false)"
              />

              <div
                v-if="errors.password"
                class="text-danger"
              >
                {{ errors.password }}
              </div>
            </div>

            <div class="col-md-6">
              <label
                for="confirm-password"
                class="form-label"
              >
                Confirm password
              </label>

              <input
                id="confirm-password"
                v-model="formData.confirmPassword"
                type="password"
                class="form-control"
                autocomplete="new-password"
                required
                @blur="validateConfirmPassword(true)"
                @input="validateConfirmPassword(false)"
              />

              <div
                v-if="errors.confirmPassword"
                class="text-danger"
              >
                {{ errors.confirmPassword }}
              </div>
            </div>
          </div>

          <div class="row mb-3">
            <div class="col-md-6">
              <label
                for="gender"
                class="form-label"
              >
                Gender
              </label>

              <select
                id="gender"
                v-model="formData.gender"
                class="form-select"
                required
                @blur="validateGender(true)"
                @change="validateGender(false)"
              >
                <option value="" disabled>
                  Select a gender
                </option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">
                  Prefer not to say
                </option>
              </select>

              <div
                v-if="errors.gender"
                class="text-danger"
              >
                {{ errors.gender }}
              </div>
            </div>

            <div class="col-md-6 d-flex align-items-end">
              <div class="form-check mb-2">
                <input
                  id="isAustralian"
                  v-model="formData.isAustralian"
                  type="checkbox"
                  class="form-check-input"
                />

                <label
                  class="form-check-label"
                  for="isAustralian"
                >
                  Australian Resident?
                </label>
              </div>
            </div>
          </div>

          <div class="mb-3">
            <label
              for="reason"
              class="form-label"
            >
              Reason for joining
            </label>

            <textarea
              id="reason"
              v-model.trim="formData.reason"
              class="form-control"
              rows="3"
              required
              @blur="validateReason(true)"
              @input="validateReason(false)"
            ></textarea>

            <div
              v-if="errors.reason"
              class="text-danger"
            >
              {{ errors.reason }}
            </div>

            <div
              v-if="
                formData.reason
                  .toLowerCase()
                  .includes('friend')
              "
              class="text-success"
            >
              It's good to have a friend.
            </div>
          </div>

          <div class="text-center">
            <button
              type="submit"
              class="btn btn-primary me-2"
              :disabled="isSubmitting"
            >
              {{
                isSubmitting
                  ? 'Registering...'
                  : 'Register'
              }}
            </button>

            <button
              type="button"
              class="btn btn-secondary"
              :disabled="isSubmitting"
              @click="clearForm"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <div
    v-if="submittedCards.length"
    class="row mt-5"
  >
    <h4>Registered users</h4>

    <DataTable
      :value="submittedCards"
      table-style="min-width: 50rem"
    >
      <Column
        field="username"
        header="Username"
      />

      <Column
        field="email"
        header="Email"
      />

      <Column
        field="isAustralian"
        header="Australian Resident"
      />

      <Column
        field="gender"
        header="Gender"
      />

      <Column
        field="reason"
        header="Reason"
      />
    </DataTable>
  </div>

  <div
    v-if="submittedCards.length"
    class="row mt-5"
  >
    <div class="d-flex flex-wrap justify-content-start">
      <div
        v-for="card in submittedCards"
        :key="card.uid"
        class="card m-2"
        style="width: 18rem"
      >
        <div class="card-header">
          User Information
        </div>

        <ul class="list-group list-group-flush">
          <li class="list-group-item">
            Username: {{ card.username }}
          </li>

          <li class="list-group-item">
            Email: {{ card.email }}
          </li>

          <li class="list-group-item">
            Australian Resident:
            {{ card.isAustralian ? 'Yes' : 'No' }}
          </li>

          <li class="list-group-item">
            Gender: {{ card.gender }}
          </li>

          <li class="list-group-item">
            Reason: {{ card.reason }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  font-family:
    'Segoe UI',
    Tahoma,
    Geneva,
    Verdana,
    sans-serif;
  max-width: 80vw;
  margin: 0 auto;
  padding: 20px;
  border-radius: 10px;
}

#username:focus,
#email:focus,
#password:focus,
#confirm-password:focus,
#isAustralian:focus,
#gender:focus,
#reason:focus {
  border-color: #275fda;
  box-shadow: 0 0 0 0.2rem rgba(39, 95, 218, 0.2);
}

.card {
  border: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-header {
  color: white;
  background-color: #275fda;
  padding: 10px;
  border-radius: 10px 10px 0 0;
}

.list-group-item {
  padding: 10px;
}
</style>