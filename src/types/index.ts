import type { Timestamp } from 'firebase/firestore'

/** Campos comuns a todos os documentos. */
export interface BaseDoc {
  id: string
  ownerId: string
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type RegimeTributario = 'simples_nacional' | 'mei' | 'lucro_presumido' | 'lucro_real'

export interface UserProfile extends BaseDoc {
  nome: string
  email: string
  empresa?: string
  regimeTributario: RegimeTributario
  conexoes: {
    whatsapp: boolean
    googleCalendar: boolean
    metaAds: boolean
    googleAds: boolean
  }
  preferenciasNotificacao: {
    push: boolean
    impostos: boolean
    contratos: boolean
    agenda: boolean
  }
}

export type ClienteTipo = 'fixo' | 'esporadico'
export type ClienteStatus = 'ativo' | 'inativo'

export interface Cliente extends BaseDoc {
  nome: string
  contato: string
  tipo: ClienteTipo
  valorContrato: number
  horasContratadas?: number
  dataInicio: Timestamp | null
  dataFim: Timestamp | null
  status: ClienteStatus
}

export type DespesaCategoria = 'transporte' | 'alimentacao' | 'material' | 'outros'
export type DespesaOrigem = 'manual' | 'ocr'

export interface Despesa extends BaseDoc {
  valor: number
  data: Timestamp | null
  categoria: DespesaCategoria
  clientId: string | null
  descricao: string
  comprovanteUrl: string | null
  origem: DespesaOrigem
}

export type InvoiceStatus = 'solicitada' | 'emitida' | 'pendente'

export interface Invoice extends BaseDoc {
  clientId: string | null
  valor: number
  descricao: string
  status: InvoiceStatus
  pdfUrl: string | null
}

export type TaxStatus = 'pendente' | 'pago' | 'atrasado'

export interface Tax extends BaseDoc {
  tipo: string
  valor: number
  vencimento: Timestamp | null
  status: TaxStatus
  multaEstimada: number | null
}

export type DeliveryStatus = 'pendente' | 'andamento' | 'entregue'

export interface Delivery extends BaseDoc {
  titulo: string
  clientId: string | null
  prazo: Timestamp | null
  status: DeliveryStatus
  responsavel: string
}

export interface TimeEntry extends BaseDoc {
  clientId: string | null
  inicio: Timestamp | null
  fim: Timestamp | null
  horas: number
  descricao: string
}

export type ContractStatus = 'a_renovar' | 'renovado' | 'encerrado' | 'ativo'

export interface Contract extends BaseDoc {
  clientId: string | null
  valor: number
  dataInicio: Timestamp | null
  dataFim: Timestamp | null
  status: ContractStatus
  pdfUrl: string | null
  obrigacoes: string[]
}

export type ConfirmacaoStatus = 'confirmado' | 'aguardando' | 'sem_resposta'

export interface Appointment extends BaseDoc {
  clientId: string | null
  titulo: string
  data: Timestamp | null
  contato?: string
  statusConfirmacao: ConfirmacaoStatus
  googleEventId: string | null
}

export type PostRede = 'instagram' | 'linkedin'
export type PostStatus = 'rascunho' | 'aprovado' | 'publicado'

export interface Post extends BaseDoc {
  rede: PostRede
  texto: string
  hashtags: string[]
  status: PostStatus
  dataAgendada: Timestamp | null
  fonteNoticia: string | null
}

export type AdPlataforma = 'meta' | 'google'

export interface AdCampaign extends BaseDoc {
  plataforma: AdPlataforma
  nome: string
  status: string
  gasto: number
  metricas: { cpc: number; cpa: number; roas: number }
  dataAtualizacao: Timestamp | null
}

export interface EmailCampaign extends BaseDoc {
  assunto: string
  corpo: string
  metricas: { aberturas: number; cliques: number }
}

export type NotificationTipo = 'imposto' | 'contrato' | 'agenda' | 'entrega' | 'geral'

export interface AppNotification extends BaseDoc {
  tipo: NotificationTipo
  titulo: string
  mensagem: string
  lida: boolean
  refId: string | null
}
