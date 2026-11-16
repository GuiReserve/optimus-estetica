# Optimus Estética

Sistema minimalista para studio de estética: login, cadastro de clientes com aniversário, agenda com check de serviço feito, cadastro de serviços, mensagens pré-definidas (automáticas e rápidas), finanças (receita total, receita por serviço, top clientes, gastos fixos e lucro) e avisos com mensagens prontas no WhatsApp (parabéns, confirmação de agendamento e acompanhamento pós-serviço).

## Como usar
Publicado no GitHub Pages: https://guireserve.github.io/optimus-estetica/ — também funciona no Vercel (headers extras em `vercel.json`). No primeiro acesso, crie seu usuário e senha.

## Contas e acesso (Supabase)
- **Painel do administrador**: cria o acesso de cada cliente (nome do negócio, responsável, usuário, e-mail de contato opcional, WhatsApp, plano, mensalidade, vencimento), gera senha provisória, renova (+1 mês), bloqueia/libera e gera nova senha. Não existe exclusão: contas são só bloqueadas.
- **Login dos clientes**: usuário e senha criados pelo administrador; troca obrigatória da senha provisória no primeiro acesso. Esqueceu a senha? O administrador gera uma nova no painel.
- **Atalho na tela inicial**: ícone com a logo (iPhone, Android e computador) via `manifest.webmanifest` e `icons/`.
- **Vencimento**: quando a data "pago até" passa, o studio perde o acesso automaticamente até ser renovado. Os dados ficam guardados.
- **Dados na nuvem**: cada studio só lê e grava os próprios dados (Row Level Security). O administrador não vê os dados dos studios.
- **Histórico**: cada salvamento guarda a versão anterior em `studio_data_history` (cópia de segurança).
- **Importação**: dados antigos salvos no navegador são importados no primeiro login e continuam no aparelho como cópia.

Banco: `supabase/migrations/001_optimus_schema.sql` · Função de servidor: `supabase/functions/admin-users`.

## Segurança
- Senhas com no mínimo 8 caracteres, letras e números; gerenciadas pelo Supabase Auth.
- Content-Security-Policy restrita (no `index.html` e em `vercel.json`), sem scripts de CDN (bibliotecas em `vendor/`).

## Licenças de terceiros
`vendor/htm-preact.module.js`: htm (Apache-2.0) e Preact (MIT). `vendor/supabase.js`: supabase-js (MIT).
