import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import { requestPushToken } from '@/lib/firebase/messaging'
import { theme } from '@/theme'
import { Card, ScreenHeader, Field, inputStyle, Spinner } from '@/components/ui'
import type { RegimeTributario } from '@/types'

const regimes: { value: RegimeTributario; label: string }[] = [
  { value: 'simples_nacional', label: 'Simples Nacional' },
  { value: 'mei', label: 'MEI' },
  { value: 'lucro_presumido', label: 'Lucro Presumido' },
  { value: 'lucro_real', label: 'Lucro Real' },
]

const conexoes: { key: 'whatsapp' | 'googleCalendar' | 'metaAds' | 'googleAds'; label: string; icon: string }[] = [
  { key: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { key: 'googleCalendar', label: 'Google Calendar', icon: '🗓️' },
  { key: 'metaAds', label: 'Meta Ads', icon: '📘' },
  { key: 'googleAds', label: 'Google Ads', icon: '🔍' },
]

export default function Configuracoes() {
  const nav = useNavigate()
  const { user, signOut } = useAuth()
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()

  const [nome, setNome] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [regime, setRegime] = useState<RegimeTributario>('simples_nacional')

  useEffect(() => {
    if (profile) {
      setNome(profile.nome ?? '')
      setEmpresa(profile.empresa ?? '')
      setRegime(profile.regimeTributario ?? 'simples_nacional')
    }
  }, [profile])

  const salvar = () => updateProfile.mutate({ nome, empresa, regimeTributario: regime })

  const togglePush = async () => {
    const atual = profile?.preferenciasNotificacao?.push
    if (!atual) {
      const token = await requestPushToken()
      await updateProfile.mutateAsync({
        preferenciasNotificacao: { ...profile!.preferenciasNotificacao, push: !!token },
        // o token é salvo num campo separado para as Functions
        ...(token ? ({ fcmToken: token } as object) : {}),
      })
    } else {
      await updateProfile.mutateAsync({ preferenciasNotificacao: { ...profile!.preferenciasNotificacao, push: false } })
    }
  }

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
  }

  return (
    <div style={{ padding: '4px 20px 0' }} className="fade">
      <ScreenHeader title="Configurações" onBack={() => nav('/')} accent={theme.color.navy} />

      <SectionTitle>Perfil</SectionTitle>
      <Card>
        <Field label="Nome">
          <input value={nome} onChange={(e) => setNome(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Empresa">
          <input value={empresa} onChange={(e) => setEmpresa(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="E-mail">
          <input value={user?.email ?? ''} disabled style={{ ...inputStyle, color: theme.color.slate, background: theme.color.bg }} />
        </Field>
        <button onClick={salvar} disabled={updateProfile.isPending} style={{ height: 44, width: '100%', borderRadius: 12, border: 'none', background: theme.color.financeiro, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 4 }}>
          {updateProfile.isPending ? 'Salvando…' : 'Salvar perfil'}
        </button>
      </Card>

      <SectionTitle>Regime tributário</SectionTitle>
      <Card>
        <select value={regime} onChange={(e) => { setRegime(e.target.value as RegimeTributario); updateProfile.mutate({ regimeTributario: e.target.value as RegimeTributario }) }} style={inputStyle}>
          {regimes.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </Card>

      <SectionTitle>Conexões</SectionTitle>
      <Card style={{ padding: 0 }}>
        {conexoes.map((c, idx) => {
          const ativo = profile?.conexoes?.[c.key]
          return (
            <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px', borderTop: idx ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ fontSize: 20 }}>{c.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: theme.color.navy }}>{c.label}</div>
                <div style={{ fontSize: 12, color: ativo ? theme.color.successDark : theme.color.slate }}>
                  {ativo ? 'Conectado' : 'Não conectado'}
                </div>
              </div>
              <Toggle on={!!ativo} onChange={() => updateProfile.mutate({ conexoes: { ...profile!.conexoes, [c.key]: !ativo } })} />
            </div>
          )
        })}
      </Card>
      <div style={{ fontSize: 11.5, color: theme.color.slateLight, marginTop: 8, paddingLeft: 4 }}>
        As integrações externas serão ativadas quando as chaves forem configuradas no servidor.
      </div>

      <SectionTitle>Notificações</SectionTitle>
      <Card style={{ padding: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px' }}>
          <div style={{ fontSize: 20 }}>🔔</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.color.navy }}>Notificações push</div>
            <div style={{ fontSize: 12, color: theme.color.slate }}>Avisos de impostos, contratos e agenda</div>
          </div>
          <Toggle on={!!profile?.preferenciasNotificacao?.push} onChange={togglePush} />
        </div>
      </Card>

      <button onClick={() => signOut().then(() => nav('/login'))} style={{ height: 48, width: '100%', borderRadius: 12, border: `1px solid ${theme.color.border}`, background: '#fff', color: theme.color.dangerDark, fontWeight: 700, fontSize: 14, cursor: 'pointer', margin: '24px 0' }}>
        Sair da conta
      </button>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, fontWeight: 700, color: theme.color.slate, textTransform: 'uppercase', letterSpacing: 0.5, margin: '20px 0 10px', paddingLeft: 4 }}>{children}</div>
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{ width: 46, height: 26, borderRadius: 20, background: on ? theme.color.successDark : '#cbd5e1', position: 'relative', cursor: 'pointer', transition: 'background .2s' }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
    </div>
  )
}
