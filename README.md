# Optimus Estética

Sistema minimalista para studio de estética: login, cadastro de clientes com aniversário, agenda com check de serviço feito, cadastro de serviços, mensagens pré-definidas (automáticas e rápidas), finanças (receita total, receita por serviço, top clientes, gastos fixos e lucro) e avisos com mensagens prontas no WhatsApp (parabéns, confirmação de agendamento e acompanhamento pós-serviço).

## Como usar
Publicado no GitHub Pages: https://guireserve.github.io/optimus-estetica/ — também funciona no Vercel (headers extras em `vercel.json`). No primeiro acesso, crie seu usuário e senha.

## Segurança
- **Senha forte obrigatória**: mínimo 8 caracteres, com letras e números. A senha nunca é armazenada.
- **Dados criptografados**: clientes, agenda, serviços e mensagens ficam salvos com AES-256-GCM; a chave é derivada da senha com PBKDF2-SHA256 (310 mil iterações, sal aleatório).
- **Proteção contra tentativas**: 5 senhas erradas bloqueiam o login por 5 minutos.
- **Trava automática**: a sessão bloqueia após 15 minutos sem uso; ao sair, os dados saem da memória.
- **Headers de proteção** (`vercel.json`): Content-Security-Policy restrita, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, noindex.
- **Sem CDN de scripts**: a biblioteca (Preact + htm) está em `vendor/`.

## Limitações
- Os dados ficam no navegador do aparelho em uso e não sincronizam entre aparelhos.
- Esqueceu a senha? Não há recuperação: os dados criptografados não podem ser lidos sem ela.
- Para uso em vários aparelhos com recuperação de senha, é preciso um backend (ex.: Supabase).

## Licenças de terceiros
`vendor/htm-preact.module.js`: htm (Apache-2.0) e Preact (MIT).
