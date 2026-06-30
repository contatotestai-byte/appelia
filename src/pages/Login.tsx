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
    height: 52,
    borderRadius: 13,
    border: '1px solid #344054',
    background: 'rgba(255,255,255,.04)',
    color: '#f9fafb',
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
          maxWidth: 420,
          minHeight: '100dvh',
          background: 'radial-gradient(120% 80% at 50% 0%,#1d2939 0%,#101828 60%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 32px 46px',
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
              borderRadius: 13,
              background: theme.color.primary,
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '7px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#344054' }} />
            <div style={{ fontSize: 11, color: '#667085' }}>ou</div>
            <div style={{ flex: 1, height: 1, background: '#344054' }} />
          </div>

          <button
            type="button"
            onClick={google}
            disabled={busy}
            style={{
              height: 50,
              border: '1px solid #344054',
              borderRadius: 13,
              background: 'transparent',
              color: '#e4e7ec',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M21.6 12.2c0-.6-.05-1.2-.15-1.7H12v3.4h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.2z" fill="#4285F4" />
              <path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" fill="#34A853" />
              <path d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9z" fill="#FBBC05" />
              <path d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6.1 12 6.1z" fill="#EA4335" />
            </svg>
            Entrar com Google
          </button>
        </form>
      </div>
    </div>
  )
}
