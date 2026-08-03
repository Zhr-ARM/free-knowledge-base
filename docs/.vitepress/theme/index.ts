import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import LibrarySearch from './components/LibrarySearch.vue'
import PdfPreview from './components/PdfPreview.vue'
import './custom.css'

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('LibrarySearch', LibrarySearch)
    app.component('PdfPreview', PdfPreview)
  }
}

export default theme
