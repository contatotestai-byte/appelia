import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { theme } from '@/theme'

export default function Login() {
  const { user, configured, signInEmail, resetPassword } = useAuth()
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
    <div className="login-shell">
      <div />
      <div className="login-col" style={{ alignItems: 'center', textAlign: 'center' }}>
        <img
          src="/brand/wordmark_white.png"
          alt="ELIÁ"
          style={{ width: 188, height: 'auto', marginBottom: 14 }}
        />
        <div style={{ fontSize: 11, letterSpacing: 4, color: '#94a3b8', fontWeight: 500 }}>
          CONSULTORIA DE PESSOAS
        </div>
      </div>

      <form onSubmit={handle} className="login-col" style={{ gap: 14 }}>
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
        </form>
      </div>
  )
}
