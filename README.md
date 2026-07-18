# Saldo Claro

Aplicacao pessoal de controle financeiro com React, Vite e Supabase. Pode ser hospedada gratuitamente na Vercel, Netlify ou Cloudflare Pages, com banco e autenticacao no plano gratuito do Supabase.

## Rodar localmente

1. No Supabase, crie um projeto gratuito e abra o **SQL Editor**.
2. Execute o conteudo de `supabase/schema.sql`.
3. Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (Settings > API).
4. Execute `npm install` e depois `npm run dev`.

Nao coloque a `service_role key` no `.env`: ela e secreta e nunca deve ir para o navegador.

## Hospedagem gratuita

Na Vercel ou Netlify, importe esta pasta como um novo projeto e configure as mesmas variaveis de ambiente. Use:

- Build command: `npm run build`
- Publish directory: `dist`

No Supabase, em Authentication > URL Configuration, adicione a URL publica da hospedagem em **Site URL** e em **Redirect URLs**.
