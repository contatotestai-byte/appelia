import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Home from '@/pages/Home'
import Notificacoes from '@/pages/Notificacoes'
import Configuracoes from '@/pages/Configuracoes'
// Financeiro
import FinanceiroHub from '@/pages/financeiro/FinanceiroHub'
import Despesas from '@/pages/financeiro/Despesas'
import NotasFiscais from '@/pages/financeiro/NotasFiscais'
import Impostos from '@/pages/financeiro/Impostos'
import ReceitasPorCliente from '@/pages/financeiro/ReceitasPorCliente'
// Stubs (próximos módulos)
import { Stub } from '@/pages/Stub'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/notificacoes" element={<Notificacoes />} />
        <Route path="/configuracoes" element={<Configuracoes />} />

        {/* Financeiro */}
        <Route path="/financeiro" element={<FinanceiroHub />} />
        <Route path="/financeiro/despesas" element={<Despesas />} />
        <Route path="/financeiro/notas-fiscais" element={<NotasFiscais />} />
        <Route path="/financeiro/impostos" element={<Impostos />} />
        <Route path="/financeiro/receitas" element={<ReceitasPorCliente />} />

        {/* Administrativo (em breve) */}
        <Route path="/admin" element={<Stub area="admin" title="Administrativo" />} />
        <Route path="/admin/*" element={<Stub area="admin" title="Administrativo" />} />

        {/* Marketing (em breve) */}
        <Route path="/marketing" element={<Stub area="marketing" title="Marketing" />} />
        <Route path="/marketing/*" element={<Stub area="marketing" title="Marketing" />} />

        {/* Assistente IA (em breve) */}
        <Route path="/assistente" element={<Stub area="assistente" title="Assistente IA" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
