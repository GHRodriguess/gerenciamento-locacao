export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface Cliente {
  id: number;
  nome: string;
  numero_celular: string;
  locacoes?: Locacao[];
}

export interface Brinquedo {
  id: number;
  tipo: string;
  ativo: boolean;
}

export interface Endereco {
  rua: string;
  numero: string;
  cidade: string;
  bairro?: string;
  estado?: string;
  complemento?: string;
}

export interface Locacao {
  id: number;
  uuid_publico: string;
  cliente: Cliente;
  data_montagem: string;
  data_devolucao: string;
  valor_total: string | number;
  brinquedos: Brinquedo[];
  endereco: Endereco;
  cancelada?: boolean;
  criado_por?: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
  };
}

export interface LocacaoFormData {
  cliente_id: number | "";
  data_montagem: string;
  data_devolucao: string;
  valor_total: string;
  brinquedos_ids: number[];
  endereco: {
    rua: string;
    numero: string;
    cidade: string;
    bairro?: string;
    estado?: string;
    complemento?: string;
  };
}

export interface DashboardMetrics {
  totalRevenue: number;
  activeLocacoes: number;
  cancelRate: number | string;
  lostRevenue: number;
  topClient: { nome: string; total: number };
  popularToy: string;
}
