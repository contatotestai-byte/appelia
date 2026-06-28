import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { theme } from '@/theme'

export default function Login() {
  const { user, configured, signInEmail, signInGoogle, resetPassword } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  if (user) {
    nav('/', { replace: true })
  }

  const handle = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (!configured) {
      setError('Firebase ainda não configurado. Preencha o arquivo .env com as chaves do projeto.')
      return
    }
    setBusy(true)
    try {
      await signInEmail(email, senha)
      nav('/', { replace: true })
    } catch {
      setError('E-mail ou senha inválidos.')
    } finally {
      setBusy(false)
    }
  }

  const google = async () => {
    setError(null)
    if (!configured) {
      setError('Firebase ainda não configurado.')
      return
    }
    setBusy(true)
    try {
      await signInGoogle()
      nav('/', { replace: true })
    } catch {
      setError('Não foi possível entrar com o Google.')
    } finally {
      setBusy(false)
    }
  }

  const reset = async () => {
    if (!email) {
      setError('Digite seu e-mail para recuperar a senha.')
      return
    }
    try {
      await resetPassword(email)
      setInfo('Enviamos um e-mail de recuperação.')
    } catch {
      setError('Não foi possível enviar o e-mail de recuperação.')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 50,
    borderRadius: 14,
    border: '1px solid #334155',
    background: '#1e293b',
    color: '#f8fafc',
    padding: '0 16px',
    fontSize: 15,
    outline: 'none',
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#cbd5e1',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 430,
          minHeight: '100dvh',
          background: 'linear-gradient(165deg,#1e293b 0%,#0f172a 70%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 32px 44px',
        }}
      >
        <div />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <img
            src="/brand/wordmark_white.png"
            alt="ELIÁ"
            style={{ width: 188, height: 'auto', marginBottom: 14 }}
          />
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#94a3b8', fontWeight: 500 }}>
            CONSULTORIA DE PESSOAS
          </div>
        </div>

        <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, display: 'block', marginBottom: 6 }}>
              E-mail
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@elia.com.br"
              type="email"
              autoComplete="email"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, display: 'block', marginBottom: 6 }}>
              Senha
            </label>
            <input
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              style={inputStyle}
            />
          </div>

          {error && <div style={{ color: '#f87171', fontSize: 13, textAlign: 'center' }}>{error}</div>}
          {info && <div style={{ color: '#34d399', fontSize: 13, textAlign: 'center' }}>{info}</div>}

          <button
            type="submit"
            disabled={busy}
            style={{
              height: 52,
              border: 'none',
              borderRadius: 14,
              background: theme.color.financeiro,
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              cursor: busy ? 'wait' : 'pointer',
              marginTop: 6,
            }}
          >
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
          <div
            onClick={reset}
            style={{ textAlign: 'center', fontSize: 13, color: '#94a3b8', marginTop: 2, cursor: 'pointer' }}
          >
            Esqueci minha senha
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#334155' }} />
            <div style={{ fontSize: 11, color: '#64748b' }}>ou</div>
            <div style={{ flex: 1, height: 1, background: '#334155' }} />
          </div>

          <button
            type="button"
            onClick={google}
            disabled={busy}
            style={{
              height: 50,
              border: '1px solid #334155',
              borderRadius: 14,
              background: 'transparent',
              color: '#e2e8f0',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontWeight: 800, color: '#fff' }}>G</span> Entrar com Google
          </button>
        </form>
      </div>
    </div>
  )
}
