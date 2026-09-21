import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './AppRoutes'

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppRoutes />
    </BrowserRouter>
  )
}
