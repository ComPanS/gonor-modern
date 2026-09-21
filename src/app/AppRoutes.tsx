import { Route, Routes } from 'react-router-dom'
import { SiteLayout } from '../components/SiteLayout'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'

export function AppRoutes() {
  return <Routes><Route element={<SiteLayout />}><Route index element={<HomePage />} /><Route path="*" element={<NotFoundPage />} /></Route></Routes>
}
