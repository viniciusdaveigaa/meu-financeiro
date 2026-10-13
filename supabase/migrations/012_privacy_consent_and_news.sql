-- Migration 012: Consentimento de Termos/Privacidade (LGPD) e Central de Novidades
-- Preserva 100% dos dados existentes com valores padrão seguros e políticas RLS rigorosas.

-- 1. TABELA DE CONSENTIMENTOS DE TERMOS E PRIVACIDADE (AUDITÁVEL E IMUTÁVEL)
create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_version text not null,
  privacy_version text not null,
  accepted_at timestamptz not null default now(),
  user_agent text,
  created_at timestamptz not null default now()
);

-- Índices para consulta ultra-rápida no login
create index if not exists user_consents_user_idx on public.user_consents(user_id, accepted_at desc);
create index if not exists user_consents_versions_idx on public.user_consents(user_id, terms_version, privacy_version);

-- Habilita Row Level Security (RLS)
alter table public.user_consents enable row level security;

-- Políticas RLS: Usuário só pode consultar e registrar seu próprio consentimento
create policy "Users can view own consents"
  on public.user_consents for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own consents"
  on public.user_consents for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 2. TABELA DA CENTRAL DE NOVIDADES E ATUALIZAÇÕES
create table if not exists public.app_updates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null check (category in ('feature', 'improvement', 'fix', 'security')),
  version text,
  published_at timestamptz not null default now(),
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- Índice para ordenação decrescente por publicação
create index if not exists app_updates_published_idx on public.app_updates(is_published, published_at desc);

-- Habilita Row Level Security (RLS)
alter table public.app_updates enable row level security;

-- Qualquer usuário autenticado ou visitante pode ler as novidades publicadas
create policy "Anyone can view published updates"
  on public.app_updates for select
  using (is_published = true);

-- Apenas service_role ou administradores podem cadastrar/alterar novidades
create policy "Service role can manage updates"
  on public.app_updates for all
  to service_role
  using (true)
  with check (true);

-- 3. TABELA DE CONTROLE DE LEITURA DE NOVIDADES POR USUÁRIO
create table if not exists public.user_update_reads (
  user_id uuid not null references auth.users(id) on delete cascade,
  update_id uuid not null references public.app_updates(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id, update_id)
);

create index if not exists user_update_reads_user_idx on public.user_update_reads(user_id);

-- Habilita Row Level Security (RLS)
alter table public.user_update_reads enable row level security;

create policy "Users can view own update reads"
  on public.user_update_reads for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can mark updates as read"
  on public.user_update_reads for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can remove read status"
  on public.user_update_reads for delete
  to authenticated
  using (auth.uid() = user_id);

-- 4. INSERÇÃO DAS NOVIDADES REAIS EFETIVAMENTE ENTREGUES NO SISTEMA
insert into public.app_updates (title, description, category, version, published_at, is_published)
values
  (
    'Personalização de Cores do Aplicativo',
    'Agora você pode personalizar todas as cores da interface através de um seletor nativo (color picker) ou código HEX manual. Conta com paletas predefinidas, prévia ao vivo e cálculo automático de contraste WCAG AA.',
    'feature',
    '2.1.0',
    now() - interval '1 hour',
    true
  ),
  (
    'Retirada de Dinheiro das Caixinhas',
    'Adicionada a funcionalidade de resgatar fundos das caixinhas de reserva. Inclui verificação de saldo disponível, opção de ocultar a retirada do extrato financeiro e tela de confirmação de segurança com resumo detalhado.',
    'feature',
    '2.1.0',
    now() - interval '2 hours',
    true
  ),
  (
    'Cartões de Crédito e Débito com Controle de Faturas',
    'Separação explícita entre compras no débito e no crédito. Compras no crédito são atribuídas à fatura correspondente conforme os dias de fechamento e vencimento, sem debitar o saldo bancário imediatamente.',
    'improvement',
    '2.1.0',
    now() - interval '3 hours',
    true
  ),
  (
    'Logos Oficiais das Instituições Financeiras',
    'Identificação visual de alta precisão em vetor SVG para os principais bancos brasileiros (Nubank, Itaú, Bradesco, Santander, Banco do Brasil, Inter, C6 Bank, Caixa, PicPay, Mercado Pago e outros).',
    'improvement',
    '2.1.0',
    now() - interval '4 hours',
    true
  ),
  (
    'Importação Modular de Extratos CSV por Banco',
    'Reestruturação completa da importação de extratos em 3 passos: seleção da instituição de origem, regras específicas por banco, prévia com validação e detecção inteligente de lançamentos duplicados.',
    'feature',
    '2.1.0',
    now() - interval '5 hours',
    true
  ),
  (
    'Consentimento de Termos e Política de Privacidade (LGPD)',
    'Fluxo formal de consentimento com registro auditável em banco de dados, histórico de versões aceitas e painel com orientações completas sobre privacidade e direitos do titular.',
    'security',
    '2.1.0',
    now() - interval '6 hours',
    true
  ),
  (
    'Otimização de Performance e Navegação Instantânea',
    'Abertura imediata de abas via cache em memória (0ms), remoção de filtros redundantes e animação suave e acolhedora ao encerrar a sessão.',
    'improvement',
    '2.0.5',
    now() - interval '1 day',
    true
  ),
  (
    'Proteção Inteligente para Login Google OAuth',
    'Detecção da modalidade de acesso do usuário com proteção de identidade, ocultando opções inadequadas de alteração de senha local para quem se conecta pelo Google.',
    'security',
    '2.0.4',
    now() - interval '2 days',
    true
  )
on conflict do nothing;

