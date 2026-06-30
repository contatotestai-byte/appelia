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
// Administrativo
import AdminHub from '@/pages/admin/AdminHub'
import Cronograma from '@/pages/admin/Cronograma'
import Horas from '@/pages/admin/Horas'
import Contratos from '@/pages/admin/Contratos'
import Agenda from '@/pages/admin/Agenda'
// Clientes
import Clientes from '@/pages/Clientes'
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
        <Route path="/clientes" element={<Clientes />} />

        {/* Financeiro */}
        <Route path="/financeiro" element={<FinanceiroHub />} />
        <Route path="/financeiro/despesas" element={<Despesas />} />
        <Route path="/financeiro/notas-fiscais" element={<NotasFiscais />} />
        <Route path="/financeiro/impostos" element={<Impostos />} />
        <Route path="/financeiro/receitas" element={<ReceitasPorCliente />} />

        {/* Administrativo */}
        <Route path="/admin" element={<AdminHub />} />
        <Route path="/admin/cronograma" element={<Cronograma />} />
        <Route path="/admin/horas" element={<Horas />} />
        <Route path="/admin/contratos" element={<Contratos />} />
        <Route path="/admin/agenda" element={<Agenda />} />

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
