import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Timestamp } from 'firebase/firestore'
import { inputToTimestamp, tsToInput, todayInput } from '@/lib/date'
import { useTaxes, useCreateTax, useUpdateTax, useDeleteTax } from '@/hooks/useTaxes'
import { callFunction } from '@/lib/firebase/functions'
import { theme, fmtBRL } from '@/theme'
import {
  Card,
  ScreenHeader,
  Sheet,
  Field,
  inputStyle,
  PrimaryButton,
  Badge,
  Spinner,
  EmptyState,
  ErrorState,
} from '@/components/ui'
import type { Tax, TaxStatus } from '@/types'

type Draft = { id?: string; tipo: string; valor: string; vencimento: string; status: TaxStatus }
const empty = (): Draft => ({ tipo: 'DAS', valor: '', vencimento: todayInput(), status: 'pendente' })

function daysUntil(ts: Timestamp | null): number | null {
  if (!ts) return null
  return Math.ceil((ts.toDate().getTime() - Date.now()) / 86400000)
}

export default function Impostos() {
  const nav = useNavigate()
  const { data, isLoading, isError, refetch } = useTaxes()
  const create = useCreateTax()
  const update = useUpdateTax()
  const remove = useDeleteTax()

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(empty())
  const [estBusy, setEstBusy] = useState(false)
  const [estimativa, setEstimativa] = useState<number | null>(null)
  const [penaltyBusy, setPenaltyBusy] = useState<string | null>(null)

  const list = data ?? []
  // marca como atrasado o que passou do vencimento e não foi pago
  const enriched = list.map((t) => {
    const d = daysUntil(t.vencimento)
    const atrasado = t.status !== 'pago' && d !== null && d < 0
    return { ...t, _status: atrasado ? ('atrasado' as TaxStatus) : t.status, _days: d }
  })
  const atrasados = enriched.filter((t) => t._status === 'atrasado')
  const aVencer = enriched.filter((t) => t._status !== 'atrasado' && t.status !== 'pago')
  const pagos = enriched.filter((t) => t.status === 'pago')

  const openNew = () => { setDraft(empty()); setOpen(true) }
  const openEdit = (t: Tax) => {
    setDraft({ id: t.id, tipo: t.tipo, valor: String(t.valor ?? ''), vencimento: tsToInput(t.vencimento), status: t.status })
    setOpen(true)
  }

  const save = async () => {
    const payload: Partial<Tax> = {
      tipo: draft.tipo,
      valor: parseFloat(draft.valor.replace(',', '.')) || 0,
      vencimento: inputToTimestamp(draft.vencimento),
      status: draft.status,
    }
    if (draft.id) await update.mutateAsync({ id: draft.id, data: payload })
    else await create.mutateAsync(payload)
    setOpen(false)
  }

  const estimar = async () => {
    setEstBusy(true)
    try {
      const res = await callFunction<Record<string, never>, { valorEstimado: number }>('estimateTaxes', {})
      setEstimativa(res.valorEstimado)
    } catch {
      setEstimativa(null)
    } finally {
      setEstBusy(false)
    }
  }

  const calcMulta = async (t: Tax) => {
    setPenaltyBusy(t.id)
    try {
      const res = await callFunction<{ taxId: string }, { multaEstimada: number }>('calcLateTaxPenalty', { taxId: t.id })
      await update.mutateAsync({ id: t.id, data: { multaEstimada: res.multaEstimada } })
    } catch {
      // fallback simples: 2% multa + 1% a.m. (estimativa local)
      const d = daysUntil(t.vencimento) ?? 0
      const meses = Math.max(1, Math.ceil(Math.abs(d) / 30))
      const multa = t.valor * 0.02 + t.valor * 0.01 * meses
      await update.mutateAsync({ id: t.id, data: { multaEstimada: Math.round(multa * 100) / 100 } })
    } finally {
      setPenaltyBusy(null)
    }
  }

  const exportarCSV = () => {
    const rows = [['Tipo', 'Valor', 'Vencimento', 'Status', 'Multa estimada']]
    for (const t of list) {
      rows.push([
        t.tipo,
        String(t.valor ?? 0),
        t.vencimento ? t.vencimento.toDate().toLocaleDateString('pt-BR') : '',
        t.status,
        t.multaEstimada != null ? String(t.multaEstimada) : '',
      ])
    }
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(';')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `impostos_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ padding: '4px 20px 0' }} className="fade">
      <ScreenHeader title="Impostos" onBack={() => nav('/financeiro')} />

      {/* estimativa do mês */}
      <Card style={{ background: `linear-gradient(150deg,${theme.color.navy2},${theme.color.navy})`, color: '#fff', borderRadius: 16 }}>
        <div style={{ fontSize: 13, color: theme.color.slateLight }}>Estimativa de imposto do mês</div>
        <div style={{ fontSize: 26, fontWeight: 800, margin: '6px 0 12px' }}>
          {estimativa != null ? fmtBRL(estimativa) : '—'}
        </div>
        <button
          onClick={estimar}
          disabled={estBusy}
          style={{ height: 40, width: '100%', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,.12)', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {estBusy ? <><Spinner color="#fff" /> Calculando…</> : '✨ Calcular estimativa com IA'}
        </button>
      </Card>

      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <PrimaryButton onClick={openNew} style={{ height: 44, fontSize: 14 }}>+ Imposto</PrimaryButton>
        <button onClick={exportarCSV} style={{ flex: 1, height: 44, borderRadius: 12, border: `1px solid ${theme.color.border}`, background: '#fff', color: theme.color.navy, fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}>
          ⬇️ Exportar p/ contador
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner /></div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon="🏛️" text="Nenhum imposto cadastrado." />
      ) : (
        <>
          {atrasados.length > 0 && (
            <Section title="Atrasados" color={theme.color.dangerDark}>
              {atrasados.map((t) => (
                <Card key={t.id} accent={theme.color.danger}>
                  <div onClick={() => openEdit(t)} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: theme.color.navy }}>{t.tipo}</div>
                      <div style={{ fontSize: 12, color: theme.color.dangerDark }}>
                        Venceu {t.vencimento?.toDate().toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: theme.color.navy }}>{fmtBRL(t.valor || 0)}</div>
                      {t.multaEstimada != null && (
                        <div style={{ fontSize: 11, color: theme.color.dangerDark }}>+ {fmtBRL(t.multaEstimada)} multa</div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => calcMulta(t)}
                    disabled={penaltyBusy === t.id}
                    style={{ marginTop: 10, height: 34, width: '100%', borderRadius: 9, border: 'none', background: '#fef2f2', color: theme.color.dangerDark, fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}
                  >
                    {penaltyBusy === t.id ? 'Calculando multa…' : '✨ Calcular multa e juros (IA)'}
                  </button>
                </Card>
              ))}
            </Section>
          )}

          {aVencer.length > 0 && (
            <Section title="A vencer" color={theme.color.navy}>
              {aVencer.map((t) => (
                <Card key={t.id} onClick={() => openEdit(t)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: theme.color.navy }}>{t.tipo}</div>
                      <div style={{ fontSize: 12, color: t._days != null && t._days <= 5 ? theme.color.dangerDark : theme.color.slate }}>
                        Vence {t.vencimento?.toDate().toLocaleDateString('pt-BR')}
                        {t._days != null && ` · ${t._days} dia(s)`}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: theme.color.navy }}>{fmtBRL(t.valor || 0)}</div>
                  </div>
                </Card>
              ))}
            </Section>
          )}

          {pagos.length > 0 && (
            <Section title="Pagos" color={theme.color.successDark}>
              {pagos.map((t) => (
                <Card key={t.id} onClick={() => openEdit(t)} style={{ opacity: 0.7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: theme.color.navy }}>{t.tipo}</div>
                    </div>
                    <Badge status="pago" />
                    <div style={{ fontSize: 14, fontWeight: 700, color: theme.color.navy }}>{fmtBRL(t.valor || 0)}</div>
                  </div>
                </Card>
              ))}
            </Section>
          )}
        </>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title={draft.id ? 'Editar imposto' : 'Novo imposto'}>
        <Field label="Tipo">
          <input value={draft.tipo} onChange={(e) => setDraft({ ...draft, tipo: e.target.value })} placeholder="DAS, IRPJ, ISS…" style={inputStyle} />
        </Field>
        <Field label="Valor (R$)">
          <input value={draft.valor} onChange={(e) => setDraft({ ...draft, valor: e.target.value })} inputMode="decimal" placeholder="0,00" style={inputStyle} />
        </Field>
        <Field label="Vencimento">
          <input type="date" value={draft.vencimento} onChange={(e) => setDraft({ ...draft, vencimento: e.target.value })} style={inputStyle} />
        </Field>
        <Field label="Status">
          <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as TaxStatus })} style={inputStyle}>
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
            <option value="atrasado">Atrasado</option>
          </select>
        </Field>

        <PrimaryButton onClick={save} disabled={create.isPending || update.isPending}>
          {create.isPending || update.isPending ? 'Salvando…' : 'Salvar'}
        </PrimaryButton>
        {draft.id && (
          <>
            {draft.status !== 'pago' && (
              <button onClick={() => setDraft({ ...draft, status: 'pago' })} style={{ width: '100%', marginTop: 10, height: 46, border: 'none', background: 'transparent', color: theme.color.successDark, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Marcar como pago
              </button>
            )}
            <button onClick={async () => { await remove.mutateAsync(draft.id!); setOpen(false) }} style={{ width: '100%', marginTop: 4, height: 46, border: 'none', background: 'transparent', color: theme.color.dangerDark, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              Excluir
            </button>
          </>
        )}
      </Sheet>
    </div>
  )
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  )
}
