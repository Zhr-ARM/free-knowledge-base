import DefaultTheme from 'vitepress/theme'
import PdfPreview from './components/PdfPreview.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('PdfPreview', PdfPreview)
  }
}
