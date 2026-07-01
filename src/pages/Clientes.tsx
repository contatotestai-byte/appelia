import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Timestamp } from 'firebase/firestore'
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '@/hooks/useClients'
import { theme, fmtBRL } from '@/theme'
import { Card, ScreenHeader, Sheet, Field, inputStyle, PrimaryButton, Spinner, EmptyState, ErrorState } from '@/components/ui'
import type { Cliente, ClienteTipo, ClienteStatus } from '@/types'

type Draft = {
  id?: string
  nome: string
  contato: string
  tipo: ClienteTipo
  valorContrato: string
  horasContratadas: string
  status: ClienteStatus
}
const empty = (): Draft => ({ nome: '', contato: '', tipo: 'fixo', valorContrato: '', horasContratadas: '', status: 'ativo' })

export default function Clientes() {
  const nav = useNavigate()
  const { data, isLoading, isError, refetch } = useClients()
  const create = useCreateClient()
  const update = useUpdateClient()
  const remove = useDeleteClient()

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(empty())

  const openNew = () => { setDraft(empty()); setOpen(true) }
  const openEdit = (c: Cliente) => {
    setDraft({ id: c.id, nome: c.nome, contato: c.contato ?? '', tipo: c.tipo, valorContrato: String(c.valorContrato ?? ''), horasContratadas: c.horasContratadas != null ? String(c.horasContratadas) : '', status: c.status })
    setOpen(true)
  }

  const save = async () => {
    const payload: Partial<Cliente> = {
      nome: draft.nome,
      contato: draft.contato,
      tipo: draft.tipo,
      valorContrato: parseFloat(draft.valorContrato.replace(',', '.')) || 0,
      horasContratadas: draft.horasContratadas ? parseFloat(draft.horasContratadas.replace(',', '.')) : 0,
      status: draft.status,
    }
    if (draft.id) {
      await update.mutateAsync({ id: draft.id, data: payload })
    } else {
      await create.mutateAsync({ ...payload, dataInicio: Timestamp.now(), dataFim: null })
    }
    setOpen(false)
  }

  const list = data ?? []

  return (
    <div style={{ padding: '4px 20px 0' }} className="fade">
      <ScreenHeader title="Clientes" onBack={() => nav('/admin')} accent={theme.color.navy} />

      <PrimaryButton onClick={openNew} style={{ height: 46, marginBottom: 16 }}>+ Novo cliente</PrimaryButton>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner /></div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon="🤝" text="Nenhum cliente cadastrado. Adicione o primeiro para usar nos lançamentos." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((c) => (
            <Card key={c.id} onClick={() => openEdit(c)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: c.tipo === 'fixo' ? '#eff6ff' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: c.tipo === 'fixo' ? theme.color.financeiro : theme.color.slate }}>
                  {c.nome.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: theme.color.navy }}>{c.nome}</div>
                  <div style={{ fontSize: 12, color: theme.color.slate }}>
                    {c.tipo === 'fixo' ? '🔵 Fixo' : '⚪ Esporádico'}
                    {c.valorContrato ? ` · ${fmtBRL(c.valorContrato)}/mês` : ''}
                  </div>
                </div>
                {c.status === 'inativo' && <span style={{ fontSize: 10.5, color: theme.color.slate, background: '#f1f5f9', padding: '3px 8px', borderRadius: 20 }}>Inativo</span>}
                <span style={{ color: '#cbd5e1', fontSize: 18 }}>›</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title={draft.id ? 'Editar cliente' : 'Novo cliente'}>
        <Field label="Nome"><input value={draft.nome} onChange={(e) => setDraft({ ...draft, nome: e.target.value })} placeholder="Nome do cliente" style={inputStyle} /></Field>
        <Field label="Contato (WhatsApp/e-mail)"><input value={draft.contato} onChange={(e) => setDraft({ ...draft, contato: e.target.value })} placeholder="5511999999999" style={inputStyle} /></Field>
        <Field label="Tipo">
          <div style={{ display: 'flex', gap: 8 }}>
            {(['fixo', 'esporadico'] as ClienteTipo[]).map((t) => (
              <button key={t} onClick={() => setDraft({ ...draft, tipo: t })} style={{ flex: 1, height: 44, border: draft.tipo === t ? `2px solid ${theme.color.financeiro}` : `1px solid ${theme.color.border}`, background: draft.tipo === t ? '#eff6ff' : '#fff', borderRadius: 12, fontSize: 13.5, fontWeight: 600, color: theme.color.navy, cursor: 'pointer' }}>
                {t === 'fixo' ? '🔵 Fixo' : '⚪ Esporádico'}
              </button>
            ))}
          </div>
        </Field>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}><Field label="Valor/mês (R$)"><input value={draft.valorContrato} onChange={(e) => setDraft({ ...draft, valorContrato: e.target.value })} inputMode="decimal" placeholder="0,00" style={inputStyle} /></Field></div>
          <div style={{ flex: 1 }}><Field label="Horas contratadas"><input value={draft.horasContratadas} onChange={(e) => setDraft({ ...draft, horasContratadas: e.target.value })} inputMode="decimal" placeholder="Ex.: 40" style={inputStyle} /></Field></div>
        </div>
        <Field label="Status">
          <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as ClienteStatus })} style={inputStyle}>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </Field>

        <PrimaryButton onClick={save} disabled={create.isPending || update.isPending || !draft.nome}>
          {create.isPending || update.isPending ? 'Salvando…' : 'Salvar cliente'}
        </PrimaryButton>
        {draft.id && (
          <button onClick={async () => { await remove.mutateAsync(draft.id!); setOpen(false) }} style={{ width: '100%', marginTop: 10, height: 46, border: 'none', background: 'transparent', color: theme.color.dangerDark, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            Excluir cliente
          </button>
        )}
      </Sheet>
    </div>
  )
}
