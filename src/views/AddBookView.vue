<script setup>
import { onMounted, ref } from 'vue'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore'
import { db } from '../firebase/firebase.js'

const title = ref('')
const author = ref('')
const category = ref('')
const publishedYear = ref('')
const minimumYear = ref(0)

const books = ref([])
const editId = ref('')
const message = ref('')
const errorMessage = ref('')

// Get books from Firestore.
// This query uses where, orderBy and limit.
const getBooks = async () => {
  errorMessage.value = ''

  try {
    const year = Number(minimumYear.value) || 0

    const bookQuery = query(
      collection(db, 'books'),
      where('publishedYear', '>=', year),
      orderBy('publishedYear', 'desc'),
      limit(5)
    )

    const result = await getDocs(bookQuery)

    books.value = []

    result.forEach((bookDocument) => {
      books.value.push({
        id: bookDocument.id,
        ...bookDocument.data()
      })
    })

    console.log('Books from Firestore:', books.value)
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Could not get books.'
  }
}

const saveBook = async () => {
  message.value = ''
  errorMessage.value = ''

  if (
    title.value.trim() === '' ||
    author.value.trim() === '' ||
    category.value === '' ||
    publishedYear.value === ''
  ) {
    errorMessage.value = 'Please complete all fields.'
    return
  }

  const book = {
    title: title.value.trim(),
    author: author.value.trim(),
    category: category.value,
    publishedYear: Number(publishedYear.value)
  }

  try {
    if (editId.value === '') {
      await addDoc(collection(db, 'books'), {
        ...book,
        createdAt: serverTimestamp()
      })

      message.value = 'Book added successfully.'
    } else {
      await updateDoc(doc(db, 'books', editId.value), {
        ...book,
        updatedAt: serverTimestamp()
      })

      message.value = 'Book updated successfully.'
    }

    clearForm()
    await getBooks()
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Could not save the book.'
  }
}

const editBook = (book) => {
  editId.value = book.id
  title.value = book.title
  author.value = book.author
  category.value = book.category
  publishedYear.value = book.publishedYear

  message.value = 'You can now update this book.'

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const removeBook = async (book) => {
  const answer = window.confirm(
    'Are you sure you want to delete ' +
      book.title +
      '?'
  )

  if (!answer) {
    return
  }

  try {
    await deleteDoc(doc(db, 'books', book.id))

    message.value = 'Book deleted successfully.'
    await getBooks()
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Could not delete the book.'
  }
}

const clearForm = () => {
  title.value = ''
  author.value = ''
  category.value = ''
  publishedYear.value = ''
  editId.value = ''
}

const cancelEdit = () => {
  clearForm()
  message.value = ''
  errorMessage.value = ''
}

onMounted(() => {
  getBooks()
})
</script>

<template>
  <div class="container mt-5">
    <div class="row">
      <div class="col-md-8 offset-md-2">
        <h1 class="text-center">
          Add Book
        </h1>

        <p class="text-center">
          Add and manage books using Firestore.
        </p>

        <div
          v-if="message"
          class="alert alert-success"
        >
          {{ message }}
        </div>

        <div
          v-if="errorMessage"
          class="alert alert-danger"
        >
          {{ errorMessage }}
        </div>

        <form
          class="card p-4"
          @submit.prevent="saveBook"
        >
          <h4>
            {{ editId ? 'Update Book' : 'Add New Book' }}
          </h4>

          <div class="mb-3">
            <label
              for="title"
              class="form-label"
            >
              Book title
            </label>

            <input
              id="title"
              v-model="title"
              type="text"
              class="form-control"
              required
            />
          </div>

          <div class="mb-3">
            <label
              for="author"
              class="form-label"
            >
              Author
            </label>

            <input
              id="author"
              v-model="author"
              type="text"
              class="form-control"
              required
            />
          </div>

          <div class="mb-3">
            <label
              for="category"
              class="form-label"
            >
              Category
            </label>

            <select
              id="category"
              v-model="category"
              class="form-select"
              required
            >
              <option value="">
                Select a category
              </option>

              <option value="Fiction">
                Fiction
              </option>

              <option value="Technology">
                Technology
              </option>

              <option value="Science">
                Science
              </option>

              <option value="History">
                History
              </option>

              <option value="Biography">
                Biography
              </option>
            </select>
          </div>

          <div class="mb-3">
            <label
              for="publishedYear"
              class="form-label"
            >
              Published year
            </label>

            <input
              id="publishedYear"
              v-model="publishedYear"
              type="number"
              class="form-control"
              min="1000"
              max="2100"
              required
            />
          </div>

          <div>
            <button
              type="submit"
              class="btn btn-primary me-2"
            >
              {{ editId ? 'Update Book' : 'Add Book' }}
            </button>

            <button
              v-if="editId"
              type="button"
              class="btn btn-secondary"
              @click="cancelEdit"
            >
              Cancel
            </button>
          </div>
        </form>

        <div class="mt-5">
          <h2>Book List</h2>

          <div class="row align-items-end mb-3">
            <div class="col-md-6">
              <label
                for="minimumYear"
                class="form-label"
              >
                Minimum published year
              </label>

              <input
                id="minimumYear"
                v-model="minimumYear"
                type="number"
                class="form-control"
                min="0"
              />
            </div>

            <div class="col-md-6">
              <button
                type="button"
                class="btn btn-success"
                @click="getBooks"
              >
                Search Books
              </button>
            </div>
          </div>

          <p class="text-muted">
            The query displays a maximum of five books,
            ordered from newest to oldest.
          </p>

          <div
            v-if="books.length === 0"
            class="alert alert-secondary"
          >
            No books found.
          </div>

          <div
            v-else
            class="table-responsive"
          >
            <table class="table table-bordered">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Year</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="book in books"
                  :key="book.id"
                >
                  <td>{{ book.title }}</td>
                  <td>{{ book.author }}</td>
                  <td>{{ book.category }}</td>
                  <td>{{ book.publishedYear }}</td>

                  <td>
                    <button
                      type="button"
                      class="btn btn-warning btn-sm me-2"
                      @click="editBook(book)"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      class="btn btn-danger btn-sm"
                      @click="removeBook(book)"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1000px;
}

.card {
  border-radius: 10px;
}

table {
  vertical-align: middle;
}
</style>