# Saldo Claro

Aplicação pessoal de controle financeiro com React, Vite e Supabase. Inclui painel mensal, saúde financeira, orçamentos, contas, cartões, parcelamentos, recorrências e caixinhas. Pode ser hospedada gratuitamente na Vercel, Netlify ou Cloudflare Pages, com banco e autenticação no plano gratuito do Supabase.

## Rodar localmente

1. No Supabase, crie um projeto gratuito e abra o **SQL Editor**.
2. Execute o conteúdo de `supabase/schema.sql`.
3. Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (Settings > API).
4. Execute `npm install` e depois `npm run dev`.

Para adicionar orçamentos a uma instalação já existente, execute também `supabase/migrations/001_budgets.sql` no SQL Editor.

Para ativar contas, cartões, recorrências e caixinhas, execute em ordem `002_daily_control.sql` e `003_savings_boxes.sql`.

Depois, execute `004_security_hardening.sql` para restringir as funções do banco aos papéis corretos.

Execute também `005_optional_savings_expense.sql` para escolher se cada aporte em uma caixinha deve ser contado como saída.

Por fim, execute `006_neutral_savings_history.sql` para exibir no histórico os aportes que não alteram o saldo.

Não coloque a `service_role key` no `.env`: ela é secreta e nunca deve ir para o navegador. O frontend deve usar somente a chave pública `anon`, com as políticas RLS ativas.

## Hospedagem gratuita

Na Vercel ou Netlify, importe esta pasta como um novo projeto e configure as mesmas variáveis de ambiente. Use:

- Build command: `npm run build`
- Publish directory: `dist`

No Supabase, em Authentication > URL Configuration, adicione a URL pública da hospedagem em **Site URL** e em **Redirect URLs**.
