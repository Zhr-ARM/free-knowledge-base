import DefaultTheme from 'vitepress/theme'
import LibrarySearch from './components/LibrarySearch.vue'
import PdfPreview from './components/PdfPreview.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('LibrarySearch', LibrarySearch)
    app.component('PdfPreview', PdfPreview)
  }
}
